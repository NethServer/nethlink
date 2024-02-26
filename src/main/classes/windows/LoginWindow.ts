import { AccountController } from '../controllers'
import { BaseWindow } from './BaseWindow'

export class LoginWindow extends BaseWindow {
  constructor() {
    super('loginpage', {
      width: 500,
      height: 0,
      show: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      titleBarStyle: 'hidden',
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
  }

  show(..._args: any): void {
    let loginWindowHeight = 0
    switch (AccountController.instance.listAvailableAccounts().length) {
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
    const bounds = this._window?.getBounds()
    this._window!.setBounds({ ...bounds, height: loginWindowHeight }, true)
    this._window!.center()
    this._window!.show()
    super.show(_args)
  }
}
