import { app, protocol } from 'electron'
import {
  LoginWindow,
  NethConnectorWindow,
  PhoneIslandWindow,
  SplashScreenWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, NethVoiceAPI } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { IPC_EVENTS } from '@shared/constants'
import path from 'path'

new AccountController(app)
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  new TrayController(toggleWindow)
  const loginWindow = new LoginWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const nethConnectorWindow = new NethConnectorWindow()

  const phoneIslandWindow = new PhoneIslandWindow()
  new PhoneIslandController(phoneIslandWindow)

  function toggleWindow(isOpening = false) {
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
          nethConnectorWindow.show()
        } else {
          accountController
            .autologin(isOpening)
            .then(() => nethConnectorWindow.show())
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
    nethConnectorWindow.show()
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

  protocol.handle('tel', (req) => {
    console.log(req)
    return new Promise((resolve) => resolve)
  })
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient('tel')

// if we are running a non-packaged version of the app && on windows
if (process.env.node_env === 'development' && process.platform === 'win32') {
  // set the path of electron.exe and your app.
  // these two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient('tel', process.execPath, [path.resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('tel')
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tel',
    privileges: {
      standard: true,
      secure: true
    }
  }
])

//windows
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
}

app.on('open-url', (ev, origin) => {
  console.log(origin)
})

app.dock?.hide()
