import { IPC_EVENTS } from '@shared/constants'
import { LOGIN_WINDOW_WIDTH, LoginWindow } from '../windows'
import { AccountController } from './AccountController'
import { log } from '@shared/utils/logger'

export class LoginController {
  static instance: LoginController

  window: LoginWindow

  constructor() {
    LoginController.instance = this
    this.window = new LoginWindow()
  }

  resize(h: number) {
    const loginPage = this.window!.getWindow()
    if (loginPage) {
      const bounds = loginPage.getBounds()
      loginPage.setBounds({
        ...bounds,
        width: LOGIN_WINDOW_WIDTH,
        height: h
      }, true)
      if (bounds.height === 0) {
        loginPage.center()
      }
    }
  }
  show() {
    this.window.show()
  }

  hide() {
    this.window!.hide()
  }

  quit() {
    try {
      this.window.quit()
    } catch (e) {
      log(e)
    }
  }


}
