import { BrowserWindow, app, ipcMain, nativeTheme, powerMonitor, protocol, shell, systemPreferences } from 'electron'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, DevToolsController } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account, AuthAppData, AvailableThemes } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { LoginController } from './classes/controllers/LoginController'
import { resolve } from 'path'
import { log } from '@shared/utils/logger'
import { NethLinkController } from './classes/controllers/NethLinkController'
import { SplashScreenController } from './classes/controllers/SplashScreenController'
import { debouncer, delay, isDev } from '@shared/utils/utils'
import { IPC_EVENTS } from '@shared/constants'
import { NetworkController } from './classes/controllers/NetworkController'
import { AppController } from './classes/controllers/AppController'
import { store, useStoreState } from './lib/mainStore'

new AppController(app)
new NetworkController()
new AccountController(app)
//log all events that the frontend part issues to the backend
registerIpcEvents()

//I set the app to open at operating system startup
app.setLoginItemSettings({
  openAtLogin: true
})

powerMonitor.on('suspend', () => {
  store.saveToDisk()
});

powerMonitor.on('resume', async () => {
  store.getFromDisk()
  setTimeout(() => {
    ipcMain.emit('update-shared-state', undefined, store.store)
  }, 500)
});

app.whenReady().then(async () => {
  isDev() && log('APP READY')
  //I assign the app as usable for tel and callto protocol response
  protocol.handle('tel', (req) => {
    return handleTelProtocol(req.url)
  })
  protocol.handle('callto', (req) => {
    return handleTelProtocol(req.url)
  })

  protocol.handle('nethlink', (req) => {
    //we have to define the purpose of the nethlink custom protocol
    isDev() && log(req)
    //TODO: define actions
    return new Promise((resolve) => resolve)

  })


  //I create the Tray controller instance - I define to it the function it should execute upon clicking on the icon
  if (isDev()) {
    new DevToolsController()
    log(process.env)
  }
  new SplashScreenController()
  new TrayController()

  //I display the splashscreen when the splashscreen component is correctly loaded.
  SplashScreenController.instance.window.addOnBuildListener(() => {
    setTimeout(startApp, 500)
  })
  SplashScreenController.instance.show()
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

app.on('quit', () => {
  isDev() && log('quit')
})

// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient('tel')
app.removeAsDefaultProtocolClient('callto')
app.removeAsDefaultProtocolClient('nethlink')

// if we are running a non-packaged version of the app && on windows
if (process.env.node_env === 'development' && process.platform === 'win32') {
  // set the path of electron.exe and your app.
  // these two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient('tel', process.execPath, [resolve(process.argv[1])])
  app.setAsDefaultProtocolClient('callto', process.execPath, [resolve(process.argv[1])])
  app.setAsDefaultProtocolClient('nethlink', process.execPath, [resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('tel')
  app.setAsDefaultProtocolClient('callto')
  app.setAsDefaultProtocolClient('nethlink')
}

app.on('open-url', (ev, origin) => {
  handleTelProtocol(origin)
})

app.dock?.hide()

//windows
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

nativeTheme.on('updated', () => {
  const theme = store.store['theme']
  const updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors
    ? 'dark'
    : 'light'
  //update theme state on the store
  store.set('theme', updatedSystemTheme)
  TrayController.instance.changeIconByTheme(updatedSystemTheme)
})

const resetApp = async () => {
  store.updateStore({
    account: undefined,
    auth: {
      availableAccounts: {},
      isFirstStart: true,
      lastUser: undefined,
      lastUserCryptPsw: undefined
    },
    theme: 'system'
  })
  await delay(100)
  store.saveToDisk()
  await delay(100)
}

const startApp = async () => {
  await resetApp()
  store.getFromDisk()
  const auth: AuthAppData | undefined = store.store['auth']
  //await delay(1500)
  await getPermissions()
  if (!auth?.isFirstStart) {
    const isLastUserLogged = await AccountController.instance.tokenLogin()
    if (isLastUserLogged) {
      ipcMain.emit(IPC_EVENTS.LOGIN)
    } else {
      store.updateStore({
        auth: {
          ...store.store['auth']!,
          lastUser: undefined,
          lastUserCryptPsw: undefined
        },
        account: undefined,
        theme: 'system'
      })
      showLogin()
    }
  } else {
    await resetApp()
    showLogin()
  }
  SplashScreenController.instance.window.quit()
  //once the loading is complete I enable the ability to click on the icon in the tray
  TrayController.instance.enableClick = true

}

const showLogin = () => {
  new LoginController()
  store.saveToDisk()
  setTimeout(() => {
    LoginController.instance.show()
  }, 100)
}

ipcMain.on(IPC_EVENTS.EMIT_START_CALL, async (_event, phoneNumber) => {
  PhoneIslandController.instance.call(phoneNumber)
})
ipcMain.on(IPC_EVENTS.LOGIN, (e, password) => {
  if (LoginController.instance.window.isOpen()) {
    LoginController.instance.quit()
    AccountController.instance.saveLoggedAccount(store.store['account']!, password)
  }
  store.saveToDisk()
  setTimeout(() => {
    new NethLinkController()
    NethLinkController.instance.show()
    setTimeout(() => {
      new PhoneIslandController()
    }, 1000)
    checkForUpdate()
  }, 500)
})

ipcMain.on(IPC_EVENTS.LOGOUT, (_event) => {
  isDev() && log('logout from event')
  PhoneIslandController.instance.logout()
  NethLinkController.instance.logout()
  AccountController.instance.logout()
  showLogin()
})

const checkForUpdate = async () => {
  const latestVersionData = await NetworkController.instance.get(`https://api.github.com/repos/nethesis/nethlink/releases/latest`)
  isDev() && log(app.getVersion())
  if (latestVersionData.name !== app.getVersion() || isDev()) {
    NethLinkController.instance.sendUpdateNotification()
  }
}

function handleTelProtocol(url: string): Promise<Response> {
  const tel = decodeURI(url)
    .replace(/ /g, '')
    .replace(/tel:\/\//g, '')
    .replace(/callto:\/\//g, '')
    .replace(/\//g, '')
  isDev() && log('TEL:', tel)
  PhoneIslandController.instance.call(tel)
  return new Promise((resolve) => resolve)
}

async function getPermissions() {
  if (process.platform === 'darwin') {
    const cameraPermissionState = systemPreferences.getMediaAccessStatus('camera')
    const cameraPermission = await systemPreferences.askForMediaAccess('camera')
    const microphonePermissionState = systemPreferences.getMediaAccessStatus('microphone')
    const microphonePermission = await systemPreferences.askForMediaAccess('microphone')
    isDev() && log(
      'Permissions:',
      {
        cameraPermissionState,
        cameraPermission,
        microphonePermissionState,
        microphonePermission
      }
    )
  }
}

