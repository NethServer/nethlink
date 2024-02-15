import { PhoneIslandConfig } from '@shared/types'
import { PhoneIslandWindow } from '../windows'
import { AccountController } from './AccountController'

export class PhoneIslandController {
  static instance: PhoneIslandController

  phoneIslandWindow: PhoneIslandWindow | undefined

  constructor() {
    PhoneIslandController.instance = this
  }

  open(token: string) {
    if (this.phoneIslandWindow) this.phoneIslandWindow.close()
    const account = AccountController.instance.getLoggedAccount()
    const webRTCExtension = account.data!.endpoints.extension.find((el) => el.type === 'webrtc')
    if (webRTCExtension) {
      const hostname = account.host.split('://')[1]
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
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
      this.phoneIslandWindow = new PhoneIslandWindow({ dataConfig })
      this.phoneIslandWindow.show()
    } else {
      throw new Error('Incorrect configuration for the logged user')
    }
  }
}
