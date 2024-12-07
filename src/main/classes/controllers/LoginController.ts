import { LOGIN_WINDOW_WIDTH, LoginWindow } from '../windows'
import { Log } from '@shared/utils/logger'

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
          loginPage.center()
        }
      }
    } catch (e) { Log.warning('error during resize LoginWindow: ', e) }
  }
  show() {
    try {
      this.window.show()
    } catch (e) { Log.warning('error during showing LoginWindow: ', e) }
  }

  hide() {
    try {
      this.window!.hide()
    } catch (e) { Log.warning('error during hiding LoginWindow: ', e) }
  }

  async quit() {
    try {
      await this.window.quit(true)
    } catch (e) {
      Log.warning('error during quitting LoginWindow: ', e)
    }
  }

  async safeQuit() {
    await this.quit()
  }

}
