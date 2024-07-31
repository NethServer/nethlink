import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { debouncer, isDev } from '@shared/utils/utils'
import { once } from '@/lib/ipcEvents'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { store } from '@/lib/mainStore'

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
        if (w === 420 && h === 98) {
          log('')
        }
        if (b.height !== h || b.width !== w) {
          window.setBounds({ width: w, height: h })
        }
        if (!window.isVisible()) {
          window.show()
          window.setAlwaysOnTop(true)
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
        window?.center()
        this.resize(bounds.w, bounds.h)
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
          this.window.quit()
          resolve()
        })
      } catch (e) {
        log(e)
        reject()
      }
    })
  }
  call(number: string) {
    const { NethVoiceAPI } = useNethVoiceAPI(store.store['account'])
    NethVoiceAPI.User.me().then((me) => {
      log('me before call start', { me })
      this.window.emit(IPC_EVENTS.START_CALL, number)
      //this.showPhoneIsland()
    })
  }

  reconnect() {
    this.window.emit(IPC_EVENTS.RECONNECT_PHONE_ISLAND)
  }

}
