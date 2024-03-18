import { Account, PhoneIslandConfig } from '@shared/types'
import { PhoneIslandWindow } from '../windows'
import { AccountController } from './AccountController'
import { IPC_EVENTS } from '@shared/constants'
import { screen } from 'electron'
import { log } from '@shared/utils/logger'
import { NethVoiceAPI } from './NethCTIController'

export class PhoneIslandController {
  static instance: PhoneIslandController

  window: PhoneIslandWindow

  constructor() {
    PhoneIslandController.instance = this
    this.window = new PhoneIslandWindow()
    // this.window.getWindow()?.on('moved', (e) => {
    //   const [x, y] = this.window.getWindow()!.getPosition()
    //   AccountController.instance.updatePhoneIslandPosition({ x, y })
    // })
    //this._addListeners()
  }

  async login(account: Account) {
    const phoneIslandTokenLoginResponse =
      await NethVoiceAPI.instance.Authentication.phoneIslandTokenLogin()
    this.updateDataConfig(phoneIslandTokenLoginResponse.token, account)
  }

  private updateDataConfig(token: string, account: Account) {
    const webRTCExtension = account!.data!.endpoints.extension.find((el) => el.type === 'webrtc')
    if (webRTCExtension && account) {
      const hostname = account!.host.split('://')[1]
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: token,
        sipExten: webRTCExtension.id,
        sipSecret: webRTCExtension.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || ''
      }
      //;('dm9pY2UuZGVtby1oZXJvbi5zZi5uZXRoc2VydmVyLm5ldDpsb3JlbnpvOmExN2ZjZDBjYTg1NDc2ZDZmOTQxZGRiM2QyNWVmMDZmMzM2M2I3ZDU6MjA5OjQ0MTYzMGYwOGJhMWY4ODdjYTU4MTUxOWFkNmJhM2Q5OjEyNy4wLjAuMToyMDEwNw==')
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      log('INIT PHONE-ISLAND', config.hostname, dataConfig)
      this.window.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, dataConfig)
    } else {
      throw new Error('Incorrect configuration for the logged user')
    }
  }

  resize(w: number, h: number) {
    const windowPhone = this.window.getWindow()
    if (windowPhone) {
      const bounds = windowPhone.getBounds()
      windowPhone.setBounds({ ...bounds, width: w, height: h }, false)
    }
  }

  call(number: string) {
    this.window.emit(IPC_EVENTS.EMIT_START_CALL, number)
  }

  logout() {
    this.window.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, undefined)
  }

  setMouseEventDisabled(isMouseEventDisabled: boolean) {
    this.window.ignoreMouseEvents(isMouseEventDisabled)
  }
}
