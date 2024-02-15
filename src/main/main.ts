import { Menu, MenuItem, MenuItemConstructorOptions, Tray, app } from 'electron'
import {
  LoginWindow,
  PhoneIslandWindow,
  SettingsWindow,
  SplashScreenWindow,
  TrayWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, NethVoiceAPI } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account } from '@shared/types'

new AccountController(app)
new PhoneIslandController()
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  const loginWindow = new LoginWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const trayWindow = new TrayWindow(toggleWindow)

  function toggleWindow() {
    // La tray deve chiudere solamente o la loginpage o la traypage, quindi il controllo viene eseguito solo su di loro
    if (trayWindow.isOpen() || loginWindow.isOpen()) {
      trayWindow.hide()
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
        accountController.getConfigFile()
        accountController
          .autologin(true)
          .then(() => trayWindow.show())
          .catch(() => {
            loginWindow.show()
          })
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
    trayWindow.show()
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
