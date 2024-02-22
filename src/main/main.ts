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
import { LoginController } from './classes/controllers/LoginController'
import { store } from '@shared/StoreController'

new AccountController(app)
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  //Creo l'istanza del Tray controller - gli definisco la funzione che deve eseguire al click sull'icona
  const trayController = new TrayController(() => toggleWindow(false))
  const loginWindow = new LoginWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const nethConnectorWindow = new NethConnectorWindow()
  const phoneIslandWindow = new PhoneIslandWindow()
  new PhoneIslandController(phoneIslandWindow)
  new LoginController(loginWindow)

  // Su linux impediamo l'apertura della NethConnectorPage all'avvio perchè prende la posizione del mouse e al primo avvio non si trova sulla tray
  function openNethConnectorPage(isOpening = false) {
    if (process.platform != 'linux' || !isOpening) {
      nethConnectorWindow.show()
    }
  }

  function toggleWindow(isOpening: boolean) {
    console.log('toggle')
    // La tray deve chiudere solamente o la loginpage o la nethconnectorpage, quindi il controllo viene eseguito solo su di loro
    if (!isOpening && (nethConnectorWindow.isOpen() || loginWindow.isOpen())) {
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
              loginWindow.emit(IPC_EVENTS.LOAD_ACCOUNTS, accountController.listAvailableAccounts())
              loginWindow.show()
            })
        }
      }
    }
  }

  accountController.onAccountChange(async (account: Account | undefined) => {
    console.log('ACCOUNT_CHANGE', account)
    nethConnectorWindow.emit(IPC_EVENTS.ACCOUNT_CHANGE, account)
    openNethConnectorPage()
    if (account) {
      try {
        loginWindow.hide()
      } catch (e) {
        console.log(e)
      }
      NethVoiceAPI.instance.Authentication.phoneIslandTokenLogin().then(
        (phoneIslandTokenLoginResponse) => {
          console.log(phoneIslandTokenLoginResponse)
          PhoneIslandController.instance.updateDataConfig(phoneIslandTokenLoginResponse.token)
        }
      )
      //const operators = await NethVoiceAPI.instance.fetchOperators()
      NethVoiceAPI.instance.HistoryCall.interval().then((lastCalls) =>
        nethConnectorWindow.emit(IPC_EVENTS.RECEIVE_HISTORY_CALLS, lastCalls)
      )
      NethVoiceAPI.instance.Phonebook.speeddials().then((speeddials) =>
        nethConnectorWindow.emit(IPC_EVENTS.RECEIVE_SPEEDDIALS, speeddials)
      )
      //nethConnectorWindow.emit(IPC_EVENTS.)
    } else {
      console.log('phonisland logout')
      PhoneIslandController.instance.logout()
      nethConnectorWindow.hide()
    }
  })

  nethConnectorWindow.addOnBuildListener(() => {
    toggleWindow(true)
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
  app.setAsDefaultProtocolClient('tel', process.execPath, [path.resolve(process.argv[1])])
  app.setAsDefaultProtocolClient('callto', process.execPath, [path.resolve(process.argv[1])])
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
  console.log('TEL:', tel)
  PhoneIslandController.instance.call(tel)
  return new Promise((resolve) => resolve)
}
