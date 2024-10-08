import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { debouncer, isDev } from '@shared/utils/utils'
import { once } from '@/lib/ipcEvents'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { store } from '@/lib/mainStore'
import { screen } from 'electron'

export class PhoneIslandController {
  static instance: PhoneIslandController
  window: PhoneIslandWindow

  constructor() {
    PhoneIslandController.instance = this
    this.window = new PhoneIslandWindow()
  }

  resize(w: number, h: number) {
    try {
      const window = this.window.getWindow()
      if (window) {
        let b = window.getBounds()
        if (b.height !== h || b.width !== w) {
          window.setBounds({ width: w, height: h })
          PhoneIslandWindow.currentSize = { width: w, height: h }
        }
        if (h === 1 && w === 1) {
          window.hide()
        } else {
          if (!window.isVisible()) {
            window.show()
            window.setAlwaysOnTop(true)
          }
        }
      }
    } catch (e) {
      log(e)
    }

  }

  showPhoneIsland() {
    try {
      const window = this.window.getWindow()
      if (window) {
        const bounds = PHONE_ISLAND_RESIZE.get(PHONE_ISLAND_EVENTS['phone-island-call-ringing'])!(
          store.store.phoneIslandPageData?.isExpanded ?? true,
          store.store.phoneIslandPageData?.isMinimized ?? false,
          store.store.phoneIslandPageData?.isDisconnected ?? false
        )
        this.resize(bounds.w, bounds.h)
        if (process.platform !== 'linux') {
          const phoneIslandPosition = AccountController.instance.getAccountPhoneIslandPosition()
          if (phoneIslandPosition) {
            const isPhoneIslandOnDisplay = screen.getAllDisplays().reduce((result, display) => {
              const area = display.workArea
              log({
                area,
                phoneIslandPosition,
                x: phoneIslandPosition.x >= area.x,
                y: phoneIslandPosition.y >= area.y,
                w: (phoneIslandPosition.x + bounds.w) < (area.x + area.width),
                h: (phoneIslandPosition.y + bounds.h) < (area.y + area.height)
              })
              return (
                result ||
                (phoneIslandPosition.x >= area.x &&
                  phoneIslandPosition.y >= area.y &&
                  (phoneIslandPosition.x + bounds.w) < (area.x + area.width) &&
                  (phoneIslandPosition.y + bounds.h) < (area.y + area.height))
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
      log(e)
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
      log(e)
    }
  }

  logout() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.window.emit(IPC_EVENTS.LOGOUT)
        once(IPC_EVENTS.LOGOUT_COMPLETED, () => {
          this.window.quit(true)
          resolve()
        })
      } catch (e) {
        log(e)
        reject()
      }
    })
  }

  call(number: string) {
    try {

      const { NethVoiceAPI } = useNethVoiceAPI(store.store['account'])
      NethVoiceAPI.User.me().then((me) => {
        log('me before call start', { me })
        this.window.emit(IPC_EVENTS.START_CALL, number)
      })
    } catch (e) {
      log(e)
    }
  }

  reconnect() {
    try {
      log('PHONE ISLAND RECONNECT')
      this.window.emit(IPC_EVENTS.RECONNECT_PHONE_ISLAND)
      once(IPC_EVENTS.LOGOUT_COMPLETED, () => {
        log('PHONE ISLAND RECONNECTION AFTER LOGOUT')
        this.window.quit(false)
        new PhoneIslandController()
      })
    } catch (e) {
      log(e)
    }
  }


  async safeQuit() {
    await this.logout()
  }
}
