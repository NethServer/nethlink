import { PhoneIslandConfig } from '@shared/types'
import { PhoneIslandWindow } from '../windows'
import { AccountController } from './AccountController'
import { IPC_EVENTS } from '@shared/constants'
import { screen } from 'electron'

export class PhoneIslandController {
  static instance: PhoneIslandController

  phoneIslandWindow: PhoneIslandWindow

  constructor(phoneIslandWindow: PhoneIslandWindow) {
    PhoneIslandController.instance = this
    this.phoneIslandWindow = phoneIslandWindow
    phoneIslandWindow.getWindow()?.on('moved', (e) => {
      const [x, y] = phoneIslandWindow.getWindow()!.getPosition()
      AccountController.instance.updatePhoneIslandPosition({ x, y })
    })
    //this._addListeners()
  }

  updateDataConfig(token: string) {
    const account = AccountController.instance.getLoggedAccount()
    const webRTCExtension = account!.data!.endpoints.extension.find((el) => el.type === 'webrtc')
    if (webRTCExtension) {
      const hostname = account!.host.split('://')[1]
      const config: PhoneIslandConfig = {
        hostname,
        username: account!.username,
        authToken: token,
        sipExten: webRTCExtension.id,
        sipSecret: webRTCExtension.secret,
        sipHost: '127.0.0.1',
        sipPort: '20107'
      }
      console.log(config)
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      this.phoneIslandWindow.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, dataConfig)
    } else {
      throw new Error('Incorrect configuration for the logged user')
    }
  }

  resize(w: number, h: number) {
    const windowPhone = this.phoneIslandWindow.getWindow()
    if (windowPhone) {
      const bounds = windowPhone.getBounds()
      windowPhone.setBounds({ ...bounds, width: w, height: h }, false)
    }
  }

  call(number: string) {
    const account = AccountController.instance.getLoggedAccount()
    const window = this.phoneIslandWindow.getWindow()!
    let position = account!.phoneIslandPosition!
    if (!position) {
      window.center()
      const [x, y] = window.getPosition()
      position = { x, y }
      AccountController.instance.updatePhoneIslandPosition(position)
    }
    window?.setPosition(position.x, position.y, true)
    this.phoneIslandWindow.emit(IPC_EVENTS.EMIT_START_CALL, number)
  }

  logout() {
    this.phoneIslandWindow.emit(IPC_EVENTS.ON_DATA_CONFIG_CHANGE, undefined)
  }

  //_addListeners() {}
}
