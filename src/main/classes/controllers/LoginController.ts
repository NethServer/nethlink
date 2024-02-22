import { LoginWindow } from '../windows'

export class LoginController {
  static instance: LoginController

  loginWindow: LoginWindow

  constructor(loginWindow: LoginWindow) {
    LoginController.instance = this
    this.loginWindow = loginWindow
  }

  resize(h: number) {
    const loginPage = this.loginWindow.getWindow()
    if (loginPage) {
      const bounds = loginPage.getBounds()
      loginPage.setBounds({ ...bounds, width: 500, height: h }, true)
      loginPage.center()
    }
  }

  hide() {
    this.loginWindow.hide()
  }
}
