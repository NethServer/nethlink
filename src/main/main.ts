import { app } from 'electron'
import {
  LoginWindow,
  NethConnectorWindow,
  PhoneIslandWindow,
  SettingsWindow,
  SplashScreenWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, NethVoiceAPI } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { IPC_EVENTS } from '@shared/constants'

new AccountController(app)
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  const trayController = new TrayController(() => toggleWindow(false))
  const loginWindow = new LoginWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const nethConnectorWindow = new NethConnectorWindow()
  const phoneIslandWindow = new PhoneIslandWindow()
  const settingsWindow = new SettingsWindow()
  new PhoneIslandController(phoneIslandWindow)

  // Su linux impediamo l'apertura della NethConnectorPage all'avvio perchè prende la posizione del mouse e al primo avvio non si trova sulla tray
  function openNethConnectorPage(isOpening: boolean) {
    if (process.platform != 'linux' || !isOpening) {
      nethConnectorWindow.show()
    }
  }

  function toggleWindow(isOpening: boolean) {
    console.log('toggle')
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
          openNethConnectorPage(isOpening)
        } else {
          accountController
            .autologin(isOpening)
            .then(() => openNethConnectorPage(isOpening))
            .catch(() => {
              loginWindow.show()
            })
        }
      }
    }
  }

  accountController.onAccountChange(async (account: Account | undefined) => {
    console.log('ACCOUNT_CHANGE', account)
    nethConnectorWindow.emit(IPC_EVENTS.ACCOUNT_CHANGE, account)
    openNethConnectorPage(true)
    if (account) {
      try {
        loginWindow.close()
      } catch (e) {
        console.log(e)
      }
      const phoneIslandTokenLoginResponse =
        await NethVoiceAPI.instance.Authentication.phoneIslandTokenLogin()
      console.log(phoneIslandTokenLoginResponse)
      PhoneIslandController.instance.updateDataConfig(phoneIslandTokenLoginResponse.token)
    } else {
      console.log('phonisland logout')
      PhoneIslandController.instance.logout()
    }
  })

  nethConnectorWindow.addOnBuildListener(() => {
    toggleWindow(true)
  })
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

app.dock?.hide()
