import { Menu, MenuItem, MenuItemConstructorOptions, Tray, app } from 'electron'
import {
  LoginWindow,
  PhoneIslandWindow,
  SettingsWindow,
  SplashScreenWindow,
  NethConnectorWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, NethVoiceAPI } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'

new AccountController(app)
new PhoneIslandController()
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  const trayController = new TrayController(toggleWindow)
  const loginWindow = new LoginWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const nethConnectorWindow = new NethConnectorWindow()

  function toggleWindow() {
    // La tray deve chiudere solamente o la loginpage o la nethconnectorpage, quindi il controllo viene eseguito solo su di loro
    if (nethConnectorWindow.isOpen() || loginWindow.isOpen()) {
      nethConnectorWindow.hide()
      loginWindow.close()
    } else {
      if (!accountController.hasConfigsFolder()) {
        accountController.createConfigFile()
        splashScreenWindow.show()
        setTimeout(() => {
          splashScreenWindow.close()
          loginWindow.show()
        }, 2500)
      } else {
        if (accountController.getLoggedAccount()) {
          nethConnectorWindow.show()
        } else {
          accountController
            .autologin(true)
            .then(() => nethConnectorWindow.show())
            .catch(() => {
              loginWindow.show()
            })
        }
      }
    }
  }

  toggleWindow()

  accountController.onAccountChange(async (account: Account | undefined) => {
    try {
      loginWindow.close()
    } catch (e) {
      console.log(e)
    }
    nethConnectorWindow.show()
    const phoneIslandTokenLoginResponse =
      await NethVoiceAPI.instance.Authentication.phoneIslandTokenLogin()
    console.log(phoneIslandTokenLoginResponse)
    PhoneIslandController.instance.open(phoneIslandTokenLoginResponse.token)
  })
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

app.dock?.hide()
