import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { ipcMain, screen } from 'electron'
import { debouncer, isDev } from '@shared/utils/utils'
import { once } from '@/lib/ipcEvents'

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
      window?.setBounds({ width: w, height: h }, false)
      window?.show()
      window?.setAlwaysOnTop(true)
    } catch (e) {
      log(e)
    }
  }

  showPhoneIsland() {
    try {
      const phoneIslandPosition = AccountController.instance.getAccountPhoneIslandPosition()
      const window = this.window.getWindow()
      const bounds = PHONE_ISLAND_RESIZE.get(PHONE_ISLAND_EVENTS['phone-island-call-ringing'])!(false, false, false)
      if (phoneIslandPosition) {
        const isPhoneIslandOnDisplay = screen.getAllDisplays().reduce((result, display) => {
          const area = display.workArea
          isDev() && log({
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
      } else {
        window?.center()
      }
      window?.show()
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
    this.window.emit(IPC_EVENTS.START_CALL, number)
    this.showPhoneIsland()
  }

  reconnect() {
    this.window.emit(IPC_EVENTS.RECONNECT_PHONE_ISLAND)
  }

}
