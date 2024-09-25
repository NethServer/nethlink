import { PAGES } from '@shared/types'
import { AccountController, TrayController } from '../controllers'
import { BaseWindow } from './BaseWindow'
import { LoginPageSize } from '@shared/constants'

export const LOGIN_WINDOW_WIDTH = 500
export class LoginWindow extends BaseWindow {
  constructor() {
    super(PAGES.LOGIN, {
      width: LoginPageSize.w,
      height: LoginPageSize.h,
      minWidth: LoginPageSize.w,
      minHeight: LoginPageSize.h,
      show: false,
      fullscreenable: true,
      titleBarStyle: 'default',
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: false,
      minimizable: true,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: false,
      roundedCorners: true,
      parent: undefined,
      hasShadow: true,
      center: true,
      fullscreen: false,
      thickFrame: true,
      icon: '../../public/LogoBlueSimpleDark.svg',
      titleBarOverlay: true,

    })

    this._window?.on('close', (e) => {
      e.preventDefault()
      this.hide()
    })
  }

}
