import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { debouncer } from '@shared/utils/utils'
import { once } from '@/lib/ipcEvents'
import { screen } from 'electron'
import { Extension, Size } from '@shared/types'

export class PhoneIslandController {
  static instance: PhoneIslandController
  window: PhoneIslandWindow
  private isWarmingUp: boolean = false

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
        if (bounds.height !== h || bounds.width !== w) {
          window.setBounds({ width: w, height: h })
          PhoneIslandWindow.currentSize = { width: w, height: h }
        }
        //make sure the size is equal to [0,0] when you want to close the phone island, otherwise the size will not close and will generate slowness problems.
        if (h === 0 && w === 0) {
          window.hide()
        } else {
          // Don't show window during warm-up
          if (!window.isVisible() && !this.isWarmingUp) {
            window.show()
            window.setAlwaysOnTop(true, 'screen-saver')
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

        this.resize(size)
        if (process.platform !== 'linux') {
          const phoneIslandPosition = AccountController.instance.getAccountPhoneIslandPosition()
          if (phoneIslandPosition) {
            const isPhoneIslandOnDisplay = screen.getAllDisplays().reduce((result, display) => {
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
            } else {
              window?.center()
            }
          }
          else {
            window?.center()
          }
        } else {
          window?.center()
        }
      }
    } catch (e) {
      Log.warning('error during showing PhoneIslandWindow:', e)
    }
  }

  hidePhoneIsland() {
    try {
      const window = this.window.getWindow()
      const phoneIslandBounds = window?.getBounds()
      if (phoneIslandBounds) {
        AccountController.instance.setAccountPhoneIslandPosition({
          x: phoneIslandBounds.x,
          y: phoneIslandBounds.y
        })
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
    this.window.emit(IPC_EVENTS.TRANSFER_CALL, to)
  }

  intrudeCall(to: string) {
    this.window.emit(IPC_EVENTS.INTRUDE_CALL, to)
  }

  listenCall(to: string) {
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
          window.show()
          window.setAlwaysOnTop(true, 'screen-saver')
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
