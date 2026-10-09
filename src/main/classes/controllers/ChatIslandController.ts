import { ChatIslandWindow } from '../windows'
import { Log } from '@shared/utils/logger'
import { screen } from 'electron'

export class ChatIslandController {
  static instance: ChatIslandController | undefined
  window: ChatIslandWindow
  private wantFocus = false
  private focusTimer: ReturnType<typeof setTimeout> | undefined
  // Distance from the work area's bottom-right corner, kept after a drag, and that display.
  private anchor = { right: 0, bottom: 0 }
  private displayId: number | undefined

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
    if (window?.isVisible())
      return screen.getDisplayMatching(window.getBounds()).workArea
    // Hidden: back on the display it was dragged to, while it is still connected.
    const d = screen.getAllDisplays().find((d) => d.id === this.displayId)
    return (d ?? screen.getPrimaryDisplay()).workArea
  }

  // After a drag: the new corner is where the island grows from.
  keepPosition() {
    const window = this.window.getWindow()
    if (!window) return
    const b = window.getBounds()
    this.displayId = screen.getDisplayMatching(b).id
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
    // Only for the resize this open causes: a later one (a message growing the dock) must not steal focus.
    this.wantFocus = true
    clearTimeout(this.focusTimer)
    this.focusTimer = setTimeout(() => (this.wantFocus = false), 1000)
  }

  async safeQuit() {
    ChatIslandController.instance = undefined
    await this.window.quit(true)
  }
}
