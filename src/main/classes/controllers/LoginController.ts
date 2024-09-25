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
    try {
      const loginPage = this.window!.getWindow()
      if (loginPage) {
        const bounds = loginPage.getBounds()
        const height = h + 32
        loginPage.setBounds({
          ...bounds,
          width: LOGIN_WINDOW_WIDTH,
          height
        }, true)
        if (bounds.height === 0) {
          loginPage.setBounds({
            ...bounds,
            width: LOGIN_WINDOW_WIDTH,
            height: 500
          }, true)
          loginPage.center()
        }
      }
    } catch (e) { log(e) }
  }
  show() {
    try {
      this.window.show()
    } catch (e) { log(e) }
  }

  hide() {
    try {
      this.window!.hide()
    } catch (e) { log(e) }
  }

  quit() {
    try {
      this.window.quit()
    } catch (e) {
      log(e)
    }
  }

  safeQuit() {
    this.quit()
  }

}
