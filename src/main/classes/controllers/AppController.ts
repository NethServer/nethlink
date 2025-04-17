import { LoginController } from "./LoginController"
import { NethLinkController } from "./NethLinkController"
import { PhoneIslandController } from "./PhoneIslandController"
import { TrayController } from "./TrayController"
import { Log } from "@shared/utils/logger"
import { DevToolsController } from "./DevToolsController"
import { store } from "@/lib/mainStore"
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
      Log.info('SAFE QUIT')
      if (LoginController.instance) {
        try {
          await LoginController.instance.safeQuit()
        } catch (e) {
          Log.warning('unable to correctly close the Login Controller:', e)
        }
      }
      if (PhoneIslandController.instance) {
        try {
          await PhoneIslandController.instance.safeQuit()
        } catch (e) {
          Log.warning('unable to correctly close the PhoneIslandController:', e)
        }
      }
      if (NethLinkController.instance) {
        try {
          await NethLinkController.instance.safeQuit()
        } catch (e) {
          Log.warning('unable to correctly close the NethLinkController:', e)
        }
      }
      try {
        TrayController.instance.tray.destroy()
      } catch (e) {
        Log.warning('unable to correctly close the TrayController:', e)
      }
      try {
        await DevToolsController.instance?.window?.quit(true)
      } catch (e) {
        Log.warning('unable to correctly close the DevToolsController:', e)
      }
      await delay(200)
      store.saveToDisk()
      await delay(500)
      AppController._app.quit()
    }
  }
}
