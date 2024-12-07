import { NethLinkWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'

export class NethLinkController {
  static instance: NethLinkController
  window: NethLinkWindow

  constructor() {
    NethLinkController.instance = this
    this.window = new NethLinkWindow()
  }

  init() {
    try {
      this.show()
    } catch (e) { Log.warning('error during initializing NethLinkWindow: ', e) }
  }

  show() {
    try {
      this.window.show()
    } catch (e) { Log.warning('error during showing NethLinkWindow: ', e) }
  }

  hide() {
    try {
      this.window.hide()
    } catch (e) { Log.warning('error during hiding NethLinkWindow: ', e) }
  }

  sendUpdateNotification() {
    try {
      this.window.emit(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
    } catch (e) { Log.warning('error during send update notification to the NethLinkWindow: ', e) }
  }

  async logout() {
    try {
      await this.window.quit(true)
    } catch (e) {
      Log.warning('error during quitting NethLinkWindow: ', e)
    }
  }

  async safeQuit() {
    await this.logout()
  }
}
