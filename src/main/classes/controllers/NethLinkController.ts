import { NethLinkWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { log } from '@shared/utils/logger'

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
    } catch (e) { log('WARNING error during initializing NethLinkWindow: ', e) }
  }

  show() {
    try {
      this.window.show()
    } catch (e) { log('WARNING error during showing NethLinkWindow: ', e) }
  }

  hide() {
    try {
      this.window.hide()
    } catch (e) { log('WARNING error during hiding NethLinkWindow: ', e) }
  }

  sendUpdateNotification() {
    try {
      this.window.emit(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
    } catch (e) { log('WARNING error during send update notification to the NethLinkWindow: ', e) }
  }

  async logout() {
    try {
      await this.window.quit(true)
    } catch (e) {
      log('WARNING error during quitting NethLinkWindow: ', e)
    }
  }

  async safeQuit() {
    await this.logout()
  }
}
