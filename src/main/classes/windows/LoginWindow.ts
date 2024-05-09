import { PAGES } from '@shared/types'
import { AccountController } from '../controllers'
import { BaseWindow } from './BaseWindow'
import { log } from '@shared/utils/logger'

export const LOGIN_WINDOW_WIDTH = 500
export class LoginWindow extends BaseWindow {
  constructor() {
    super(PAGES.LOGIN, {
      width: LOGIN_WINDOW_WIDTH,
      height: 0,
      show: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: true,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      //tabbingIdentifier: 'nethconnector',
      thickFrame: false
    })
    //this._window?.webContents.openDevTools({ mode: 'detach' })
  }

  show(..._args: any): void {
    let loginWindowHeight = 0
    const accounts = AccountController.instance.listAvailableAccounts()
    switch (accounts.length) {
      case 0:
        loginWindowHeight = 570
        break
      case 1:
        loginWindowHeight = 375
        break
      case 2:
        loginWindowHeight = 455
        break
      default:
        loginWindowHeight = 535
        break
    }
    log(accounts, loginWindowHeight)
    const bounds = this._window?.getBounds()
    this._window!.setBounds({ ...bounds, height: loginWindowHeight }, true)
    super.show(_args)
    this._window!.center()
  }
}
