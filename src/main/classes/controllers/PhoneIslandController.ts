import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { debouncer } from '@shared/utils/utils'
import { once } from '@/lib/ipcEvents'
import { screen } from 'electron'
import { Extension, PhoneIslandPosition, Size } from '@shared/types'

export class PhoneIslandController {
  static instance: PhoneIslandController
  window: PhoneIslandWindow
  private isWarmingUp: boolean = false
  private lastVisibleBounds: Electron.Rectangle | undefined

  private isValidVisibleBounds(bounds: Electron.Rectangle | undefined): bounds is Electron.Rectangle {
    return !!bounds && bounds.width > 1 && bounds.height > 1
  }

  private rememberVisibleBounds(bounds: Electron.Rectangle | undefined) {
    if (this.isValidVisibleBounds(bounds)) {
      this.lastVisibleBounds = { ...bounds }
    }
  }

  private getPersistableBounds(bounds: Electron.Rectangle | undefined): Electron.Rectangle | undefined {
    if (this.isValidVisibleBounds(bounds)) {
      return bounds
    }

    return this.lastVisibleBounds ? { ...this.lastVisibleBounds } : undefined
  }

  private getBoundsForSize(bounds: Electron.Rectangle, size: Size): Electron.Rectangle {
    return {
      x: bounds.x,
      y: bounds.y,
      width: size.w,
      height: size.h
    }
  }

  private areBoundsEqual(left: Electron.Rectangle, right: Electron.Rectangle): boolean {
    return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height
  }

  private buildSavedPosition(bounds: Electron.Rectangle): PhoneIslandPosition {
    const display = screen.getDisplayMatching(bounds)

    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      displayId: display.id,
      displayScaleFactor: display.scaleFactor,
      displayBounds: {
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height
      },
      workArea: {
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: display.workArea.height
      }
    }
  }

  private savePhoneIslandPosition(bounds: Electron.Rectangle) {
    this.rememberVisibleBounds(bounds)
    AccountController.instance.setAccountPhoneIslandPosition(this.buildSavedPosition(bounds))
  }

  private isRectInsideWorkArea(bounds: Electron.Rectangle, workArea: Electron.Rectangle): boolean {
    return (
      bounds.x >= workArea.x &&
      bounds.y >= workArea.y &&
      bounds.x + bounds.width <= workArea.x + workArea.width &&
      bounds.y + bounds.height <= workArea.y + workArea.height
    )
  }

  private clampBoundsToDisplay(bounds: Electron.Rectangle, display: Electron.Display): Electron.Rectangle {
    const { workArea } = display
    const width = Math.min(bounds.width, workArea.width)
    const height = Math.min(bounds.height, workArea.height)
    const maxX = workArea.x + workArea.width - width
    const maxY = workArea.y + workArea.height - height

    return {
      x: Math.min(Math.max(bounds.x, workArea.x), maxX),
      y: Math.min(Math.max(bounds.y, workArea.y), maxY),
      width,
      height
    }
  }

  private getPrimaryDisplayBounds(size: Size): Electron.Rectangle {
    const primaryDisplay = screen.getPrimaryDisplay()
    const width = Math.min(size.w, primaryDisplay.workArea.width)
    const height = Math.min(size.h, primaryDisplay.workArea.height)

    return {
      x: primaryDisplay.workArea.x + Math.round((primaryDisplay.workArea.width - width) / 2),
      y: primaryDisplay.workArea.y + Math.round((primaryDisplay.workArea.height - height) / 2),
      width,
      height
    }
  }

  private hasDisplayContextChanged(savedPosition: PhoneIslandPosition, display: Electron.Display): boolean {
    if (savedPosition.displayScaleFactor !== undefined && Math.abs(savedPosition.displayScaleFactor - display.scaleFactor) > 0.01) {
      return true
    }

    if (savedPosition.workArea) {
      const { workArea } = savedPosition
      return (
        workArea.x !== display.workArea.x ||
        workArea.y !== display.workArea.y ||
        workArea.width !== display.workArea.width ||
        workArea.height !== display.workArea.height
      )
    }

    return false
  }

  private resolveWindowsBounds(size: Size): Electron.Rectangle {
    const savedPosition = AccountController.instance.getAccountPhoneIslandPosition()

    if (!savedPosition) {
      const primaryBounds = this.getPrimaryDisplayBounds(size)
      Log.info(`PhoneIsland no saved Windows position, fallback to primary display (${primaryBounds.x}, ${primaryBounds.y})`)
      return primaryBounds
    }

    const displays = screen.getAllDisplays()
    const savedBounds: Electron.Rectangle = {
      x: savedPosition.x,
      y: savedPosition.y,
      width: size.w,
      height: size.h
    }

    const displayFromId = savedPosition.displayId !== undefined
      ? displays.find((display) => display.id === savedPosition.displayId)
      : undefined

    if (displayFromId) {
      if (this.hasDisplayContextChanged(savedPosition, displayFromId)) {
        const primaryBounds = this.getPrimaryDisplayBounds(size)
        Log.info('PhoneIsland saved Windows display context changed, fallback to primary display', {
          savedPosition,
          displayId: displayFromId.id,
          currentScaleFactor: displayFromId.scaleFactor,
          currentWorkArea: displayFromId.workArea,
          fallbackBounds: primaryBounds
        })
        return primaryBounds
      }

      const clampedBounds = this.clampBoundsToDisplay(savedBounds, displayFromId)
      Log.info('PhoneIsland restored on saved Windows display', {
        savedPosition,
        displayId: displayFromId.id,
        restoredBounds: clampedBounds
      })
      return clampedBounds
    }

    const displayMatchingBounds = displays.find((display) => this.isRectInsideWorkArea(savedBounds, display.workArea))
    if (displayMatchingBounds) {
      const clampedBounds = this.clampBoundsToDisplay(savedBounds, displayMatchingBounds)
      Log.info('PhoneIsland restored from legacy Windows position', {
        savedPosition,
        displayId: displayMatchingBounds.id,
        restoredBounds: clampedBounds
      })
      return clampedBounds
    }

    const primaryBounds = this.getPrimaryDisplayBounds(size)
    Log.info('PhoneIsland saved Windows position is invalid, fallback to primary display', {
      savedPosition,
      displays: displays.map((display) => ({
        id: display.id,
        scaleFactor: display.scaleFactor,
        workArea: display.workArea
      })),
      fallbackBounds: primaryBounds
    })
    return primaryBounds
  }

  constructor() {
    PhoneIslandController.instance = this
    this.window = new PhoneIslandWindow()
  }

  resize(size: Size) {
    try {
      const { w, h } = size
      const window = this.window.getWindow()
      if (window) {
        const bounds = window.getBounds()
        this.rememberVisibleBounds(bounds)
        const nextBounds = this.getBoundsForSize(bounds, size)

        if (!this.areBoundsEqual(bounds, nextBounds)) {
          window.setBounds(nextBounds, false)
          PhoneIslandWindow.currentSize = { width: w, height: h }
          if (w > 0 && h > 0) {
            this.rememberVisibleBounds(window.getBounds())
          }
        }
        //make sure the size is equal to [0,0] when you want to close the phone island, otherwise the size will not close and will generate slowness problems.
        if (h === 0 && w === 0) {
          const persistableBounds = this.getPersistableBounds(bounds)
          if (persistableBounds) {
            this.savePhoneIslandPosition(persistableBounds)
          }
          window.hide()
          const hiddenFrom = persistableBounds || bounds
          Log.info(`PhoneIsland resize to 0x0 -> hidden from (${hiddenFrom.x}, ${hiddenFrom.y})`)
        } else {
          // Don't show window during warm-up
          if (!window.isVisible() && !this.isWarmingUp) {
            if (process.platform === 'win32') {
              const restoredBounds = this.resolveWindowsBounds(size)
              window.setBounds(restoredBounds, false)
              this.rememberVisibleBounds(restoredBounds)
            }
            window.show()
            window.setAlwaysOnTop(true, 'screen-saver')
            const finalBounds = window.getBounds()
            this.rememberVisibleBounds(finalBounds)
            Log.info(`PhoneIsland shown via resize at position (${finalBounds.x}, ${finalBounds.y}) size ${finalBounds.width}x${finalBounds.height}`)
          }
        }
      }
    } catch (e) {
      Log.warning('error during resizing PhoneIslandWindow:', e)
    }

  }

  showPhoneIsland(size: Size) {
    try {
      const window = this.window.getWindow()
      if (window) {
        Log.info(`PhoneIsland showPhoneIsland called with size ${size.w}x${size.h}`)
        this.resize(size)
        if (process.platform === 'win32') {
          const restoredBounds = this.resolveWindowsBounds(size)
          window.setBounds(restoredBounds, false)
          this.rememberVisibleBounds(restoredBounds)
          if (!window.isVisible() && !this.isWarmingUp) {
            window.show()
            window.setAlwaysOnTop(true, 'screen-saver')
          }
        } else if (process.platform !== 'linux') {
          const phoneIslandPosition = AccountController.instance.getAccountPhoneIslandPosition()
          Log.info(`PhoneIsland saved position: ${phoneIslandPosition ? `(${phoneIslandPosition.x}, ${phoneIslandPosition.y})` : 'none'}`)
          if (phoneIslandPosition) {
            const displays = screen.getAllDisplays()
            const isPhoneIslandOnDisplay = displays.reduce((result, display) => {
              const area = display.workArea
              return (
                result ||
                (phoneIslandPosition.x >= area.x &&
                  phoneIslandPosition.y >= area.y &&
                  (phoneIslandPosition.x + size.w) < (area.x + area.width) &&
                  (phoneIslandPosition.y + size.h) < (area.y + area.height))
              )
            }, false)
            if (isPhoneIslandOnDisplay) {
              window?.setBounds({ x: phoneIslandPosition.x, y: phoneIslandPosition.y }, false)
              Log.info(`PhoneIsland positioned at saved location (${phoneIslandPosition.x}, ${phoneIslandPosition.y})`)
            } else {
              window?.center()
              Log.info(`PhoneIsland saved position is off-screen, centered instead. Displays: ${JSON.stringify(displays.map(d => d.workArea))}`)
            }
          }
          else {
            window?.center()
            Log.info('PhoneIsland no saved position, centered')
          }
        } else {
          window?.center()
        }
        const finalBounds = window.getBounds()
        Log.info(`PhoneIsland final bounds after showPhoneIsland: (${finalBounds.x}, ${finalBounds.y}) ${finalBounds.width}x${finalBounds.height}`)
      }
    } catch (e) {
      Log.warning('error during showing PhoneIslandWindow:', e)
    }
  }

  hidePhoneIsland() {
    try {
      const window = this.window.getWindow()
      const phoneIslandBounds = window?.getBounds()
      const persistableBounds = this.getPersistableBounds(phoneIslandBounds)
      if (persistableBounds) {
        Log.info(`PhoneIsland hiding, saving position (${persistableBounds.x}, ${persistableBounds.y}) size ${persistableBounds.width}x${persistableBounds.height}`)
        this.savePhoneIslandPosition(persistableBounds)
      }
      debouncer('hide', () => window?.hide(), 250)
    } catch (e) {
      Log.warning('error during hiding PhoneIslandWindow:', e)
    }
  }

  logout() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.window.emit(IPC_EVENTS.LOGOUT)
        once(IPC_EVENTS.LOGOUT_COMPLETED, async () => {
          await this.window.quit(true)
          resolve()
        })
      } catch (e) {
        Log.error('during emitting logout event to the PhoneIslandWindow:', e)
        reject()
      }
    })
  }

  call(number: string) {
    try {
      this.window.emit(IPC_EVENTS.START_CALL, number)
    } catch (e) {
      Log.error(`Unable to call ${number}`)
    }
  }

  callTransfer(to: string) {
    Log.info("Tranfer to", to)
    this.window.emit(IPC_EVENTS.TRANSFER_CALL, to)
  }

  intrudeCall(to: string) {
    Log.info("Intrude to", to)
    this.window.emit(IPC_EVENTS.INTRUDE_CALL, to)
  }

  listenCall(to: string) {
    Log.info("Listen to", to)
    this.window.emit(IPC_EVENTS.LISTEN_CALL, to)
  }

  updateDefaultDevice(ext: Extension, force: boolean) {
    try {

      //const { NethVoiceAPI } = useNethVoiceAPI(store.store.account)
      //NethVoiceAPI.User.me().then((me) => {
      this.window.emit(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, ext, force)
      //})
    } catch (e) {
      Log.warning('error during emitting updateDefaultDevice event to the PhoneIslandWindow:', e)
    }
  }

  reconnect() {
    try {
      Log.info('PHONE ISLAND RECONNECT')
      this.window.emit(IPC_EVENTS.RECONNECT_PHONE_ISLAND)
      once(IPC_EVENTS.LOGOUT_COMPLETED, () => {
        Log.info('PHONE ISLAND RECONNECTION AFTER LOGOUT')
        this.window.quit(false)
        new PhoneIslandController()
      })
    } catch (e) {
      Log.warning('error during emitting reconnect event to the PhoneIslandWindow:', e)
    }
  }

  muteAudio() {
    try {
      const window = this.window.getWindow()
      if (window && window.webContents) {
        window.webContents.setAudioMuted(true)
        Log.info('PhoneIsland audio muted')
      }
    } catch (e) {
      Log.warning('error during muting PhoneIsland audio:', e)
    }
  }

  unmuteAudio() {
    try {
      const window = this.window.getWindow()
      if (window && window.webContents) {
        window.webContents.setAudioMuted(false)
        Log.info('PhoneIsland audio unmuted')
      }
    } catch (e) {
      Log.warning('error during unmuting PhoneIsland audio:', e)
    }
  }

  forceHide() {
    try {
      const window = this.window.getWindow()
      if (window) {
        this.isWarmingUp = true
        const persistableBounds = this.getPersistableBounds(window.getBounds())
        if (persistableBounds) {
          this.savePhoneIslandPosition(persistableBounds)
        }
        window.hide()
        Log.info('PhoneIsland window hidden')
      }
    } catch (e) {
      Log.warning('error during force hiding PhoneIsland:', e)
    }
  }

  forceShow() {
    try {
      const window = this.window.getWindow()
      if (window) {
        this.isWarmingUp = false
        // Only show if there's actually content (size > 0)
        const bounds = window.getBounds()
        if (bounds.width > 0 && bounds.height > 0) {
          if (process.platform === 'win32') {
            const restoredBounds = this.resolveWindowsBounds({ w: bounds.width, h: bounds.height })
            window.setBounds(restoredBounds, false)
            this.rememberVisibleBounds(restoredBounds)
          }
          window.show()
          window.setAlwaysOnTop(true, 'screen-saver')
          this.rememberVisibleBounds(window.getBounds())
          Log.info('PhoneIsland window shown')
        }
      }
    } catch (e) {
      Log.warning('error during force showing PhoneIsland:', e)
    }
  }

  async safeQuit() {
    await this.logout()
  }
}
