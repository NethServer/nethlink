import { Account, AvailableThemes } from '@shared/types'
import { NethLinkWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { delay } from '@shared/utils/utils'
import { nativeTheme } from 'electron'
import { log } from '@shared/utils/logger'
import { AccountController } from './AccountController'

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
    } catch (e) { log(e) }
  }

  show() {
    try {
      this.window.show()
    } catch (e) { log(e) }
  }

  hide() {
    try {
      this.window.hide()
    } catch (e) { log(e) }
  }

  sendUpdateNotification() {
    try {
      this.window.emit(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
    } catch (e) { log(e) }
  }

  logout() {
    try {
      this.window.quit()
    } catch (e) {
      log(e)
    }
  }
}
