import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { AccountController } from './AccountController'
import { ipcMain, screen } from 'electron'
import { debouncer } from '@shared/utils/utils'

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

      if (phoneIslandPosition) {
        const isPhoneIslandOnDisplay = screen.getAllDisplays().reduce((result, display) => {
          const area = display.workArea
          return (
            result ||
            (phoneIslandPosition.x >= area.x &&
              phoneIslandPosition.y >= area.y &&
              phoneIslandPosition.x + 420 < area.x + area.width &&
              phoneIslandPosition.y + 98 < area.y + area.height)
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
    try {
      this.window.emit(IPC_EVENTS.LOGOUT)
      this.window.quit()
    } catch (e) {
      log(e)
    }
  }
  call(number: string) {
    this.window.emit(IPC_EVENTS.START_CALL, number)
    this.showPhoneIsland()
  }

  reconnect() {
    this.window.emit(IPC_EVENTS.RECONNECT_PHONE_ISLAND)
  }

}
