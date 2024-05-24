import { Account } from "@shared/types"
import { AccountController } from "./AccountController"
import { LoginController } from "./LoginController"
import { NethLinkController } from "./NethLinkController"
import { PhoneIslandController } from "./PhoneIslandController"
import { SplashScreenController } from "./SplashScreenController"
import { TrayController } from "./TrayController"
import { log } from "@shared/utils/logger"
import { DevToolsController } from "./DevToolsController"
import { delay } from "@shared/utils/utils"

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
      AccountController.instance.removeAllEventListener()
      const account = AccountController.instance.getLoggedAccount()
      try {
        if (account) {
          await AccountController.instance.logout(true)
        }
      } catch (e) {
        log(e)
      }
      setTimeout(async () => {
        try {
          SplashScreenController.instance.window.quit()
        } catch (e) {
          log(e)
        }
        try {
          NethLinkController.instance.window.quit()
        } catch (e) {
          log(e)
        }
        try {
          PhoneIslandController.instance.window.quit()
        } catch (e) {
          log(e)
        }
        try {
          LoginController.instance.window.quit()
        } catch (e) {
          log(e)
        }
        try {
          TrayController.instance.tray.destroy()
        } catch (e) {
          log(e)
        }
        try {
          DevToolsController.instance?.window?.quit()
        } catch (e) {
          log(e)
        }
        AppController._app.exit()
      }, 1500)
    }
  }
}
