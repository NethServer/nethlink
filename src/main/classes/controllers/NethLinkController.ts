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
    this.show()
  }

  show() {
    this.window.show()
  }

  hide() {
    this.window.hide()
  }

  sendUpdateNotification() {
    this.window.emit(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
  }

  logout() {
    try {
      this.window.quit()
    } catch (e) {
      log(e)
    }
  }
}
