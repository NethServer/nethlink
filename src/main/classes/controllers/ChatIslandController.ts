import { ChatIslandWindow } from '../windows'
import { Log } from '@shared/utils/logger'
import { IPC_EVENTS } from '@shared/constants'
import { screen } from 'electron'

type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
type Rect = { x: number; y: number; w: number; h: number }
type Size = {
  w: number
  h: number
  dock?: Rect
  corner?: Corner
  side?: number
}

// Between the window's edge and the dock: the island's right-4/left-4 and bottom-8/top-8.
// The page may ask for more room at the sides (`side`): that part may stick out of the screen.
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
  private size: Size = { w: 0, h: 0 }
  // While dragged the window keeps its size and only follows the cursor: resizes wait for the drop.
  private drag: { w: number; h: number; x?: number; y?: number } | undefined
  private through = false
  // A new corner moves the dock to the window's other side: hidden until the island has drawn it there.
  private flip: ReturnType<typeof setTimeout> | undefined

  constructor() {
    ChatIslandController.instance = this
    this.window = new ChatIslandWindow()
  }

  // Sized to the island, grown from the corner nearest the dock; hidden when there is nothing to show.
  resize(size: Size) {
    try {
      this.size = size
      if (this.drag || (this.flip && size.corner !== this.corner)) return
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
      const slack = (size.side ?? SIDE) - SIDE
      const w = Math.min(Math.ceil(size.w), width + 2 * slack)
      const h = Math.min(Math.ceil(size.h), height)
      const left = this.corner.endsWith('left')
        ? x + this.anchor.x - slack
        : x + width - this.anchor.x + slack - w
      const top = this.corner.startsWith('top')
        ? y + this.anchor.y
        : y + height - this.anchor.y - h
      const was = window.getBounds()
      window.setBounds({
        x: Math.min(Math.max(x - slack, left), x + width + slack - w),
        y: Math.min(Math.max(y, top), y + height - h),
        width: w,
        height: h,
      })
      // Same size: the page is already drawn for the new corner, only the window moved.
      if (this.flip) this.reveal(was.width === w && was.height === h ? 0 : 32)
      if (this.wantFocus) {
        this.wantFocus = false
        window.show()
        window.focus()
      } else if (!window.isVisible()) window.showInactive()
    } catch (e) {
      Log.warning('error during resizing ChatIslandWindow:', e)
    }
  }

  // The display the dock was dropped on, while it is still connected; not the one most of the transparent window is on.
  private workArea() {
    const d = screen.getAllDisplays().find((d) => d.id === this.displayId)
    return (d ?? screen.getPrimaryDisplay()).workArea
  }

  startDrag() {
    const b = this.window.getWindow()?.getBounds()
    if (!b) return
    this.clickThrough(false)
    this.drag = { w: b.width, h: b.height }
  }

  dragTo(x: number, y: number) {
    const window = this.window.getWindow()
    if (!window || !this.drag || (x === this.drag.x && y === this.drag.y))
      return
    this.drag.x = x
    this.drag.y = y
    window.setBounds({ x, y, width: this.drag.w, height: this.drag.h }, false)
  }

  stopDrag(moved: boolean) {
    if (!this.drag) return
    this.drag = undefined
    if (moved) this.keepPosition()
    else this.resize(this.size)
  }

  // Transparent parts let the mouse through; hover is still reported, so the page can take it back.
  clickThrough(through: boolean) {
    if (through === this.through || (through && this.drag)) return
    this.through = through
    this.window.getWindow()?.setIgnoreMouseEvents(through, { forward: true })
  }

  // After a drag: the corner nearest the dock is where the island grows from, as in the CTI.
  keepPosition() {
    const window = this.window.getWindow()
    if (!window) return
    const b = window.getBounds()
    const side = this.size.side ?? SIDE
    // The dock sits in the window's corner: its place follows from the bounds, only its size is measured.
    const w = this.size.dock?.w ?? b.width - 2 * side
    const h = this.size.dock?.h ?? b.height - 2 * END
    const dock = {
      x: this.corner.endsWith('left') ? b.x + side : b.x + b.width - side - w,
      y: this.corner.startsWith('top') ? b.y + END : b.y + b.height - END - h,
      w,
      h,
    }
    this.displayId = screen.getDisplayNearestPoint({
      x: Math.round(dock.x + w / 2),
      y: Math.round(dock.y + h / 2),
    }).id
    const { x, y, width, height } = this.workArea()
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
    // The dock alone in a symmetric window (as large on both sides) stays put when the corner changes.
    const alone =
      side > SIDE && b.width - 2 * side - w < 2 && b.height - 2 * END - h < 2
    if (corner !== this.corner && alone) {
      this.corner = corner
      this.window.emit(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-corner', corner)
    } else if (corner !== this.corner) {
      this.corner = corner
      window.setOpacity(0)
      // Placed by the island's next size, which carries the new corner; shown anyway if it never comes.
      this.reveal(500, true)
      this.window.emit(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-corner', corner)
      return
    }
    // Back inside the dock's screen, grown from its corner.
    this.resize(this.size)
  }

  private reveal(ms: number, place = false) {
    clearTimeout(this.flip)
    const show = () => {
      this.flip = undefined
      if (place) this.resize(this.size)
      this.window.getWindow()?.setOpacity(1)
    }
    if (ms) this.flip = setTimeout(show, ms)
    else show()
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
