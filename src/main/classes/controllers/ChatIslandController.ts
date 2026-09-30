import { ChatIslandWindow } from '../windows'
import { Log } from '@shared/utils/logger'
import { screen } from 'electron'

export class ChatIslandController {
  static instance: ChatIslandController | undefined
  window: ChatIslandWindow
  private wantFocus = false

  constructor() {
    ChatIslandController.instance = this
    this.window = new ChatIslandWindow()
  }

  // Sized to the island, in the bottom-right corner; hidden when there is nothing to show.
  resize(size: { w: number; h: number }) {
    try {
      const window = this.window.getWindow()
      if (!window) return
      if (size.w < 8 || size.h < 8) {
        window.hide()
        return
      }
      const { x, y, width, height } = screen.getPrimaryDisplay().workArea
      const w = Math.min(Math.ceil(size.w), width)
      const h = Math.min(Math.ceil(size.h), height)
      window.setBounds({
        x: x + width - w,
        y: y + height - h,
        width: w,
        height: h,
      })
      if (this.wantFocus) {
        this.wantFocus = false
        window.show()
        window.focus()
      } else if (!window.isVisible()) window.showInactive()
    } catch (e) {
      Log.warning('error during resizing ChatIslandWindow:', e)
    }
  }

  // Focus once the island has sized the window for what it opens.
  focus() {
    const window = this.window.getWindow()
    if (window?.isVisible()) window.focus()
    this.wantFocus = true
  }

  async safeQuit() {
    ChatIslandController.instance = undefined
    await this.window.quit(true)
  }
}
