import { CommandBarWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { debouncer } from '@shared/utils/utils'
import { screen } from 'electron'

export class CommandBarController {
  static instance: CommandBarController
  window: CommandBarWindow
  private isVisible: boolean = false
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
          this.hide()
        })
      }
    })
  }

  show() {
    try {
      const window = this.window.getWindow()
      if (window && !this.isVisible) {
        // Restore original size if it was reset to [0,0]
        const bounds = window.getBounds()
        window.setBounds({
          width: this.originalSize.width,
          height: this.originalSize.height
        })

        const cursorPoint = screen.getCursorScreenPoint()
        const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
        const { x, y, width, height } = currentDisplay.workArea
        const windowBounds = window.getBounds()

        const centerX = x + Math.round((width - windowBounds.width) / 2)
        const centerY = y + Math.round(height * 0.3)

        window.setBounds({ x: centerX, y: centerY })
        window.show()
        window.setAlwaysOnTop(true, 'screen-saver')

        // Small delay to ensure focus is applied after window is shown
        setTimeout(() => {
          window.focus()
          if (window.webContents) {
            window.webContents.focus()
          }
        }, 50)

        this.isVisible = true
        this.window.emit(IPC_EVENTS.SHOW_COMMAND_BAR)
      }
    } catch (e) {
      Log.warning('error during showing CommandBarWindow:', e)
    }
  }

  hide() {
    try {
      const window = this.window.getWindow()
      if (window && this.isVisible) {
        this.isVisible = false
        // Reset size to [0,0] to avoid slowness/inconsistent state - same as PhoneIsland pattern
        window.setBounds({ width: 0, height: 0 })
        debouncer('hide-command-bar', () => {
          window.hide()
          this.window.emit(IPC_EVENTS.HIDE_COMMAND_BAR)
        }, 100)
      }
    } catch (e) {
      Log.warning('error during hiding CommandBarWindow:', e)
    }
  }

  toggle() {
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
