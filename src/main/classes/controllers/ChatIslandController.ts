import { ChatIslandWindow } from '../windows'
import { Log } from '@shared/utils/logger'
import { screen } from 'electron'

export class ChatIslandController {
  static instance: ChatIslandController | undefined
  window: ChatIslandWindow
  private wantFocus = false
  // Distance from the work area's bottom-right corner, kept after a drag.
  private anchor = { right: 0, bottom: 0 }

  constructor() {
    ChatIslandController.instance = this
    this.window = new ChatIslandWindow()
  }

  // Sized to the island, grown from its bottom-right corner; hidden when there is nothing to show.
  resize(size: { w: number; h: number }) {
    try {
      const window = this.window.getWindow()
      if (!window) return
      if (size.w < 8 || size.h < 8) {
        window.hide()
        return
      }
      const { x, y, width, height } = this.workArea()
      const w = Math.min(Math.ceil(size.w), width)
      const h = Math.min(Math.ceil(size.h), height)
      window.setBounds({
        x: Math.max(x, x + width - this.anchor.right - w),
        y: Math.max(y, y + height - this.anchor.bottom - h),
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

  private workArea() {
    const window = this.window.getWindow()
    return window?.isVisible()
      ? screen.getDisplayMatching(window.getBounds()).workArea
      : screen.getPrimaryDisplay().workArea
  }

  // After a drag: the new corner is where the island grows from.
  keepPosition() {
    const window = this.window.getWindow()
    if (!window) return
    const b = window.getBounds()
    const { x, y, width, height } = this.workArea()
    this.anchor = {
      right: Math.max(0, x + width - b.x - b.width),
      bottom: Math.max(0, y + height - b.y - b.height),
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
