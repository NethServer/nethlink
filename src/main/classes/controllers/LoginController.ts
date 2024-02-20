import { LoginWindow } from '../windows'

export class LoginController {
  static instance: LoginController

  loginWindow: LoginWindow

  constructor(loginWindow: LoginWindow) {
    LoginController.instance = this
    this.loginWindow = loginWindow
  }

  resize(w: number, h: number) {
    const loginPage = this.loginWindow.getWindow()
    if (loginPage) {
      const bounds = loginPage.getBounds()
      loginPage.setBounds({ ...bounds, width: w, height: h }, false)
      loginPage.center()
    }
  }
}
