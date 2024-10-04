import { Account } from "@shared/types"
import { AccountController } from "./AccountController"
import { LoginController } from "./LoginController"
import { NethLinkController } from "./NethLinkController"
import { PhoneIslandController } from "./PhoneIslandController"
import { SplashScreenController } from "./SplashScreenController"
import { TrayController } from "./TrayController"
import { log } from "@shared/utils/logger"
import { DevToolsController } from "./DevToolsController"
import { store } from "@/lib/mainStore"
import { delay, isDev } from "@shared/utils/utils"

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
      if (LoginController.instance) {
        try {
          await LoginController.instance.safeQuit()
        } catch (e) {
          log(e)
        }
      }
      if (PhoneIslandController.instance) {
        try {
          await PhoneIslandController.instance.safeQuit()
        } catch (e) {
          log(e)
        }
      }
      if (NethLinkController.instance) {
        try {
          await NethLinkController.instance.safeQuit()
        } catch (e) {
          log(e)
        }
      }
      try {
        TrayController.instance.tray.destroy()
      } catch (e) {
        log(e)
      }
      try {
        await DevToolsController.instance?.window?.quit(true)
      } catch (e) {
        log(e)
      }
      await delay(200)
      store.saveToDisk()
      await delay(500)
      AppController._app.exit()
    }
  }
}
