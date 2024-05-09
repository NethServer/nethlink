import { Account } from "@shared/types"
import { AccountController } from "./AccountController"
import { LoginController } from "./LoginController"
import { NethLinkController } from "./NethLinkController"
import { PhoneIslandController } from "./PhoneIslandController"
import { SplashScreenController } from "./SplashScreenController"
import { TrayController } from "./TrayController"
import { log } from "@shared/utils/logger"
import { DevToolsController } from "./DevToolsController"

export class AppController {
  static _app: Electron.App
  static onQuit = false
  constructor(app: Electron.App) {
    AppController._app = app
  }


  static async safeQuit() {
    if (!AppController.onQuit) {
      AppController.onQuit = true
      log('SAFE QUIT')
      SplashScreenController.instance.window.hide()
      NethLinkController.instance.window.hide()
      PhoneIslandController.instance.window.hide()
      LoginController.instance.window.hide()
      const account = AccountController.instance.getLoggedAccount()
      try {
        await PhoneIslandController.instance.logout(account!)
      } catch (e) {
        log(e)
      }
      setTimeout(() => {
        SplashScreenController.instance.window.quit()
        NethLinkController.instance.window.quit()
        PhoneIslandController.instance.window.quit()
        LoginController.instance.window.quit()
        DevToolsController.instance.window.quit()
        TrayController.instance.tray.destroy()
        AppController._app.exit()
      }, 1500)
    }
  }
}
