import { CommandBarWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { screen } from 'electron'

export class CommandBarController {
  static instance: CommandBarController
  window: CommandBarWindow
  private isVisible: boolean = false

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
        const cursorPoint = screen.getCursorScreenPoint()
        const currentDisplay = screen.getDisplayNearestPoint(cursorPoint)
        const { x, y, width, height } = currentDisplay.workArea
        const windowBounds = window.getBounds()

        const centerX = x + Math.round((width - windowBounds.width) / 2)
        const centerY = y + Math.round(height * 0.3)

        window.setBounds({ x: centerX, y: centerY })
        window.show()
        window.setAlwaysOnTop(true, 'screen-saver')
        window.focus()
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
        window.hide()
        this.isVisible = false
        this.window.emit(IPC_EVENTS.HIDE_COMMAND_BAR)
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
