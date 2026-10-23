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
  // The island's size the last time a chat was open: the room the next one needs.
  private open: { w: number; h: number } | undefined
  // While the window takes the mouse: the cursor, since a window not in front gets no mouse moves to say it left.
  private watch: ReturnType<typeof setInterval> | undefined
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
      if (this.drag || (this.flip && size.corner !== this.corner)) {
        // Held until the drop or the new corner: logged to find a chat window left at the dock's size.
        if (!this.drag)
          Log.info(
            'chat island: size held for the new corner',
            size.w,
            size.h,
            size.corner,
            this.corner,
          )
        return
      }
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
      const fromLeft = this.corner.endsWith('left')
      const fromTop = this.corner.startsWith('top')
      const left = fromLeft
        ? x + this.anchor.x - slack
        : x + width - this.anchor.x + slack - w
      const top = fromTop ? y + this.anchor.y : y + height - this.anchor.y - h
      const was = window.getBounds()
      // Whole pixels: the dock's measured size is fractional, and setBounds throws on it.
      const bounds = {
        x: Math.round(
          Math.min(Math.max(x - slack, left), x + width + slack - w),
        ),
        y: Math.round(Math.min(Math.max(y, top), y + height - h)),
        width: w,
        height: h,
      }
      window.setBounds(bounds)
      // Pushed to fit on the screen: that is where it stays, also once the chat closes.
      this.anchor = {
        x: fromLeft ? bounds.x + slack - x : x + width + slack - w - bounds.x,
        y: fromTop ? bounds.y - y : y + height - h - bounds.y,
      }
      // Same size: the page is already drawn for the new corner, only the window moved.
      if (this.flip) this.reveal(was.width === w && was.height === h ? 0 : 32)
      if (this.wantFocus) {
        this.wantFocus = false
        window.show()
        window.focus()
      } else if (!window.isVisible()) window.showInactive()
      const got = window.getBounds()
      if (
        got.x !== bounds.x ||
        got.y !== bounds.y ||
        got.width !== bounds.width ||
        got.height !== bounds.height
      )
        Log.warning('chat island: window not where it was put', bounds, got)
      const side = size.side ?? SIDE
      if (!this.alone(bounds)) this.open = { w: w - 2 * side, h: h - 2 * END }
      // Back to the dock alone (a chat closed): the next one opens the other way only if it would not fit.
      else if (this.toward(bounds) !== this.corner) this.keepPosition()
    } catch (e) {
      Log.warning(
        'error during resizing ChatIslandWindow:',
        String(e),
        JSON.stringify(size),
      )
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
    window.setBounds(
      {
        x: Math.round(x),
        y: Math.round(y),
        width: this.drag.w,
        height: this.drag.h,
      },
      false,
    )
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
    clearInterval(this.watch)
    if (!through) this.watch = setInterval(() => this.left(), 100)
  }

  // Out of the island (the window less the tooltips' room and END): the mouse goes through again.
  private left() {
    const window = this.window.getWindow()
    const side = this.size.side
    if (!window?.isVisible() || side === undefined) return
    const b = window.getBounds()
    const p = screen.getCursorScreenPoint()
    if (
      p.x < b.x + side ||
      p.x >= b.x + b.width - side ||
      p.y < b.y + END ||
      p.y >= b.y + b.height - END
    )
      this.clickThrough(true)
  }

  // After a drag: the corner nearest the dock is where the island grows from, as in the CTI.
  keepPosition() {
    const window = this.window.getWindow()
    if (!window) return
    const b = window.getBounds()
    const side = this.size.side ?? SIDE
    // The whole island where it was dropped (the window less its margins): it stays there, grown from its nearest corner.
    const box = {
      x: b.x + side,
      y: b.y + END,
      w: b.width - 2 * side,
      h: b.height - 2 * END,
    }
    this.displayId = screen.getDisplayNearestPoint({
      x: Math.round(box.x + box.w / 2),
      y: Math.round(box.y + box.h / 2),
    }).id
    const { x, y, width, height } = this.workArea()
    const alone = this.alone(b)
    // A new corner only for the dock alone: with a chat open it would jump to the chat's other side.
    const corner = alone ? this.toward(b) : this.corner
    const left = corner.endsWith('left')
    const top = corner.startsWith('top')
    // Kept on the screen, where resize puts it: the dock stays there when the chat closes.
    this.anchor = {
      x: Math.min(
        Math.max(0, left ? box.x - SIDE - x : x + width - box.x - box.w - SIDE),
        Math.max(0, width - box.w - 2 * SIDE),
      ),
      y: Math.min(
        Math.max(0, top ? box.y - END - y : y + height - box.y - box.h - END),
        Math.max(0, height - box.h - 2 * END),
      ),
    }
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
    // Back inside the island's screen, grown from its corner.
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

  // The dock alone in a symmetric window (as large on both sides): it stays put when the corner changes.
  private alone(b: Electron.Rectangle) {
    const side = this.size.side ?? SIDE
    const dock = this.size.dock
    return (
      side > SIDE &&
      !!dock &&
      b.width - 2 * side - dock.w < 2 &&
      b.height - 2 * END - dock.h < 2
    )
  }

  // For the dock alone: the side each way the last chat opened, while one still fits there; else the other, or the screen's middle.
  private toward(b: Electron.Rectangle): Corner {
    const { x, y, width, height } = this.workArea()
    const side = this.size.side ?? SIDE
    const d = {
      x: b.x + side,
      y: b.y + END,
      w: b.width - 2 * side,
      h: b.height - 2 * END,
    }
    const o = this.open ?? { w: 0, h: 0 }
    const pick = (
      now: boolean,
      fitsA: boolean,
      fitsB: boolean,
      middle: boolean,
    ) => (fitsA === fitsB ? (fitsA ? now : middle) : fitsA)
    const left = pick(
      this.corner.endsWith('left'),
      d.x + o.w <= x + width - SIDE,
      d.x + d.w - o.w >= x + SIDE,
      d.x + d.w / 2 < x + width / 2,
    )
    const top = pick(
      this.corner.startsWith('top'),
      d.y + o.h <= y + height - END,
      d.y + d.h - o.h >= y + END,
      d.y + d.h / 2 < y + height / 2,
    )
    return `${top ? 'top' : 'bottom'}-${left ? 'left' : 'right'}`
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
    clearInterval(this.watch)
    ChatIslandController.instance = undefined
    await this.window.quit(true)
  }
}
