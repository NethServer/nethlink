import { app, protocol, nativeTheme } from 'electron'
import {
  LoginWindow,
  NethLinkWindow,
  PhoneIslandWindow,
  SplashScreenWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, NethVoiceAPI } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account, AvailableThemes } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { IPC_EVENTS } from '@shared/constants'
import { LoginController } from './classes/controllers/LoginController'
import { resolve } from 'path'
import { log } from '@shared/utils/logger'

new AccountController(app)
const accountController = AccountController.instance
registerIpcEvents()

app.setLoginItemSettings({
  openAtLogin: true
})

app.whenReady().then(() => {
  //Creo l'istanza del Tray controller - gli definisco la funzione che deve eseguire al click sull'icona
  const trayController = new TrayController(() => toggleWindow(false))
  const loginWindow = new LoginWindow()
  const nethLinkWindow = new NethLinkWindow(() => toggleWindow(false))
  const phoneIslandWindow = new PhoneIslandWindow()
  const splashScreenWindow = new SplashScreenWindow()
  new PhoneIslandController(phoneIslandWindow)
  new LoginController(loginWindow)

  function toggleWindow(isOpening: boolean) {
    // La tray deve chiudere solamente o la loginpage o la nethconnectorpage, quindi il controllo viene eseguito solo su di loro
    if (nethLinkWindow.isOpen() || loginWindow.isOpen()) {
      nethLinkWindow.hide()
      loginWindow.hide()
    } else {
      if (!accountController.hasConfigsFolder()) {
        accountController.createConfigFile()
        splashScreenWindow.show()
        setTimeout(() => {
          splashScreenWindow.hide()
          loginWindow.show()
        }, 2500)
      } else {
        if (accountController.getLoggedAccount()) {
          nethLinkWindow.show()
        } else {
          accountController
            .autologin(isOpening)
            .then(() => nethLinkWindow.show())
            .catch(() => {
              loginWindow.emit(IPC_EVENTS.LOAD_ACCOUNTS, accountController.listAvailableAccounts())
              loginWindow.show()
            })
        }
      }
    }
  }

  loginWindow.addOnBuildListener(() => {
    toggleWindow(true)
  })

  accountController.onAccountChange(async (account: Account | undefined) => {
    if (account) {
      try {
        nethLinkWindow.emit(IPC_EVENTS.ACCOUNT_CHANGE, account)
        nethLinkWindow.show()
        loginWindow.hide()
      } catch (e) {
        console.error(e)
      }
      NethVoiceAPI.instance.Authentication.phoneIslandTokenLogin().then(
        (phoneIslandTokenLoginResponse) => {
          PhoneIslandController.instance.updateDataConfig(phoneIslandTokenLoginResponse.token)
        }
      )
      //const operators = await NethVoiceAPI.instance.fetchOperators()
      NethVoiceAPI.instance.HistoryCall.interval().then((lastCalls) =>
        nethLinkWindow.emit(IPC_EVENTS.RECEIVE_HISTORY_CALLS, lastCalls)
      )
      NethVoiceAPI.instance.Phonebook.speeddials().then((speeddials) =>
        nethLinkWindow.emit(IPC_EVENTS.RECEIVE_SPEEDDIALS, speeddials)
      )
      //nethConnectorWindow.emit(IPC_EVENTS.)
    } else {
      loginWindow.emit(IPC_EVENTS.LOAD_ACCOUNTS, accountController.listAvailableAccounts())
      loginWindow.show()
      PhoneIslandController.instance.logout()
      nethLinkWindow.hide()
    }
  })

  nethLinkWindow.addOnBuildListener(() => {
    toggleWindow(true)
    nativeTheme.on('updated', () => {
      const updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      nethLinkWindow.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
    })
  })

  protocol.handle('tel', (req) => {
    return handleTelProtocol(req.url)
  })
  protocol.handle('callto', (req) => {
    return handleTelProtocol(req.url)
  })
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient('tel')
app.removeAsDefaultProtocolClient('callto')

// if we are running a non-packaged version of the app && on windows
if (process.env.node_env === 'development' && process.platform === 'win32') {
  // set the path of electron.exe and your app.
  // these two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient('tel', process.execPath, [resolve(process.argv[1])])
  app.setAsDefaultProtocolClient('callto', process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('tel')
  app.setAsDefaultProtocolClient('callto')
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tel',
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      bypassCSP: true,
      supportFetchAPI: true,
      codeCache: true,
      allowServiceWorkers: true,
      corsEnabled: true
    }
  }
])

//windows
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

app.on('open-url', (ev, origin) => {
  handleTelProtocol(origin)
})

app.dock?.hide()
function handleTelProtocol(url: string): Promise<Response> {
  const tel = decodeURI(url)
    .replace(/ /g, '')
    .replace(/tel:\/\//g, '')
    .replace(/callto:\/\//g, '')
    .replace(/\//g, '')
  log('TEL:', tel)
  PhoneIslandController.instance.call(tel)
  return new Promise((resolve) => resolve)
}
