import { PAGES } from '@shared/types'
import { TrayController } from '../controllers'
import { BaseWindow } from './BaseWindow'
import { LoginPageSize } from '@shared/constants'
import { log } from '@shared/utils/logger'

export const LOGIN_WINDOW_WIDTH = 500
export class LoginWindow extends BaseWindow {
  constructor() {
    super(PAGES.LOGIN, {
      width: LoginPageSize.w,
      height: LoginPageSize.h,
      minWidth: LoginPageSize.w,
      minHeight: LoginPageSize.h,
      show: false,
      fullscreenable: false,
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

  show(): void {
    try {
      super.show()
      const bounds = this._window?.getBounds()
      if (bounds && (bounds?.height === LoginPageSize.h)) {
        bounds.height = 500;
        this._window?.setBounds(bounds)
        this._window?.center()
      }
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    }
    catch (e) {
      log(e)
    }
  }

  hide(..._args: any): void {
    try {
      this._window?.hide()
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    } catch (e) {
      log(e)
    }
  }

}
