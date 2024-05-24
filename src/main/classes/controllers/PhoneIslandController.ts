import { Account, PhoneIslandConfig } from '@shared/types'
import { PhoneIslandWindow } from '../windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { NethVoiceAPI } from './NethCTIController'
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

  async login(account: Account) {
    const API = NethVoiceAPI.api()
    log('API', API.Authentication)
    const phoneIslandTokenLoginResponse = await API.Authentication.phoneIslandTokenLogin()
    this.updateDataConfig(phoneIslandTokenLoginResponse.token, account)
  }

  private updateDataConfig(token: string, account: Account) {
    const nethlinkExtension = account!.data!.endpoints.extension.find((el) => el.type === 'nethlink')
    if (nethlinkExtension && account) {
      const hostname = account!.host.split('://')[1]
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: token,
        sipExten: nethlinkExtension.id,
        sipSecret: nethlinkExtension.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || ''
      }
      //;('dm9pY2UuZGVtby1oZXJvbi5zZi5uZXRoc2VydmVyLm5ldDpsb3JlbnpvOmExN2ZjZDBjYTg1NDc2ZDZmOTQxZGRiM2QyNWVmMDZmMzM2M2I3ZDU6MjA5OjQ0MTYzMGYwOGJhMWY4ODdjYTU4MTUxOWFkNmJhM2Q5OjEyNy4wLjAuMToyMDEwNw==')
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      //log('INIT PHONE-ISLAND', config.hostname, dataConfig)
      this.window.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, dataConfig, account)
    } else {
      throw new Error('Incorrect configuration for the logged user')
    }
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

  call(number: string) {
    this.window.emit(IPC_EVENTS.EMIT_START_CALL, number)
    this.showPhoneIsland()
  }

  async logout(account: Account) {
    let isResolved = false
    return new Promise<void>((resolve, reject) => {
      this.window.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, undefined, account)
      try {
        ipcMain.on(PHONE_ISLAND_EVENTS['phone-island-socket-disconnected'], () => {
          this.hidePhoneIsland()
          isResolved = true
          resolve()
        })
        setTimeout(() => {
          if (!isResolved) reject(new Error('timeout logout'))
        }, 5000)
      } catch (e) {
        reject(e)
      }
    })
  }
}
