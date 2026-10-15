import { ChatIslandWindow } from '../windows'
import { Log } from '@shared/utils/logger'
import { IPC_EVENTS } from '@shared/constants'
import { screen } from 'electron'

type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
type Rect = { x: number; y: number; w: number; h: number }

// Between the window's edge and the dock: the island's right-4/left-4 and bottom-8/top-8.
const SIDE = 16
const END = 32

export class ChatIslandController {
  static instance: ChatIslandController | undefined
  window: ChatIslandWindow
  private wantFocus = false
  private focusTimer: ReturnType<typeof setTimeout> | undefined
  // The work area's corner nearest the dock, and the window's distance from its two edges, kept after a drag.
  private corner: Corner = 'bottom-right'
  private anchor = { x: 0, y: 0 }
  private displayId: number | undefined
  private size: { w: number; h: number; dock?: Rect; corner?: Corner } = {
    w: 0,
    h: 0,
  }

  constructor() {
    ChatIslandController.instance = this
    this.window = new ChatIslandWindow()
  }

  // Sized to the island, grown from the corner nearest the dock; hidden when there is nothing to show.
  resize(size: { w: number; h: number; dock?: Rect; corner?: Corner }) {
    try {
      this.size = size
      // A reloaded island starts from the default corner: tell it the current one.
      if (size.corner && size.corner !== this.corner)
        this.window.emit(
          IPC_EVENTS.CHAT_TO_ISLAND,
          'chat-island-corner',
          this.corner,
        )
      const window = this.window.getWindow()
      if (!window) return
      if (size.w < 8 || size.h < 8) {
        window.hide()
        return
      }
      const { x, y, width, height } = this.workArea()
      const w = Math.min(Math.ceil(size.w), width)
      const h = Math.min(Math.ceil(size.h), height)
      const left = this.corner.endsWith('left')
        ? x + this.anchor.x
        : x + width - this.anchor.x - w
      const top = this.corner.startsWith('top')
        ? y + this.anchor.y
        : y + height - this.anchor.y - h
      window.setBounds({
        x: Math.min(Math.max(x, left), x + width - w),
        y: Math.min(Math.max(y, top), y + height - h),
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

  // After a drag: the corner nearest the dock is where the island grows from, as in the CTI.
  keepPosition() {
    const window = this.window.getWindow()
    if (!window) return
    const b = window.getBounds()
    this.displayId = screen.getDisplayMatching(b).id
    const { x, y, width, height } = this.workArea()
    // The dock sits in the window's corner: its place follows from the bounds, only its size is measured.
    const w = this.size.dock?.w ?? b.width - 2 * SIDE
    const h = this.size.dock?.h ?? b.height - 2 * END
    const dock = {
      x: this.corner.endsWith('left') ? b.x + SIDE : b.x + b.width - SIDE - w,
      y: this.corner.startsWith('top') ? b.y + END : b.y + b.height - END - h,
      w,
      h,
    }
    const left = dock.x + dock.w / 2 < x + width / 2
    const top = dock.y + dock.h / 2 < y + height / 2
    const corner: Corner = `${top ? 'top' : 'bottom'}-${left ? 'left' : 'right'}`
    this.anchor = {
      x: Math.max(
        0,
        left ? dock.x - SIDE - x : x + width - dock.x - dock.w - SIDE,
      ),
      y: Math.max(
        0,
        top ? dock.y - END - y : y + height - dock.y - dock.h - END,
      ),
    }
    if (corner !== this.corner) {
      this.corner = corner
      this.window.emit(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-corner', corner)
      this.resize(this.size)
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
