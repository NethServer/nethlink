import { CommandBarWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { debouncer } from '@shared/utils/utils'
import { forceWindowFocus } from '@/lib/windowsFocus'
import { screen } from 'electron'

export class CommandBarController {
  static instance: CommandBarController
  window: CommandBarWindow
  private isVisible: boolean = false
  private isShowingInProgress: boolean = false // Grace period to ignore blur during focus transition
  private lastToggleTime: number = 0 // Throttle toggle calls
  private originalSize = { width: 500, height: 80 }

  constructor() {
    CommandBarController.instance = this
    this.window = new CommandBarWindow()
    this.setupBlurListener()
  }

  private setupBlurListener() {
    this.window.addOnBuildListener(() => {
      const window = this.window.getWindow()
      if (window) {
        window.on('blur', () => {
          // Ignore blur during the grace period after showing
          if (!this.isShowingInProgress) {
            this.hide()
          }
        })
      }
    })
  }

  show() {
    try {
      const window = this.window.getWindow()
      if (window && !this.isVisible) {
        // Start grace period to ignore blur events during focus transition
        this.isShowingInProgress = true

        const cursorPoint = screen.getCursorScreenPoint()
        const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
        const { x, y, width, height } = currentDisplay.workArea

        const centerX = x + Math.round((width - this.originalSize.width) / 2)
        const centerY = y + Math.round(height * 0.3)

        // Always pass the full rect to setBounds to avoid DPI issues on Windows
        window.setBounds({
          x: centerX,
          y: centerY,
          width: this.originalSize.width,
          height: this.originalSize.height
        })

        const isWindows = process.platform === 'win32'

        this.isVisible = true

        if (isWindows) {
          // Windows: use native API to force focus
          window.show()
          window.setAlwaysOnTop(true, 'screen-saver')
          setTimeout(() => {
            // Use native Windows API to force foreground
            forceWindowFocus(window)
            window.focus()
            window.webContents?.focus()
            // Emit SHOW_COMMAND_BAR after focus operations complete
            this.window.emit(IPC_EVENTS.SHOW_COMMAND_BAR)
            // End grace period after focus is applied
            setTimeout(() => {
              this.isShowingInProgress = false
            }, 350)
          }, 50)
        } else {
          // macOS/Linux
          window.show()
          window.setAlwaysOnTop(true, 'screen-saver')
          this.window.emit(IPC_EVENTS.SHOW_COMMAND_BAR)
          setTimeout(() => {
            window.focus()
            window.webContents?.focus()
            // End grace period after focus is applied
            this.isShowingInProgress = false
          }, 50)
        }
      }
    } catch (e) {
      this.isShowingInProgress = false
      Log.warning('error during showing CommandBarWindow:', e)
    }
  }

  hide() {
    const isMac = process.platform === 'darwin'

    try {
      const window = this.window.getWindow()
      if (window && this.isVisible) {
        this.isVisible = false

        if (isMac) {
          window.hide()
          this.window.emit(IPC_EVENTS.HIDE_COMMAND_BAR)
        } else {
          debouncer(
            'hide-command-bar',
            () => {
              window.hide()
              this.window.emit(IPC_EVENTS.HIDE_COMMAND_BAR)
            },
            100
          )
        }
      }
    } catch (e) {
      Log.warning('error during hiding CommandBarWindow:', e)
    }
  }

  resize(size: { width: number, height: number }) {
    try {
      const window = this.window.getWindow()
      if (window && this.isVisible) {
        const bounds = window.getBounds()
        // Always pass the full rect to avoid DPI issues on Windows
        window.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: size.width,
          height: size.height
        })
      }
    } catch (e) {
      Log.warning('error during resizing CommandBarWindow:', e)
    }
  }

  toggle() {
    // Throttle toggle calls to prevent rapid open/close cycles
    const now = Date.now()
    if (now - this.lastToggleTime < 300) {
      return
    }
    this.lastToggleTime = now

    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  isOpen(): boolean {
    return this.isVisible
  }

  async safeQuit() {
    await this.window.quit(true)
  }
}
