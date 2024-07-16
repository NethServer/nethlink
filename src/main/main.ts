import { BrowserWindow, app, clipboard, globalShortcut, ipcMain, nativeTheme, powerMonitor, protocol, shell, systemPreferences } from 'electron'
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
import { store } from './lib/mainStore'
import fs from 'fs'
import path from 'path'


///LOGGER
const logFilePath = path.join(app.getPath("userData"), './logs/app.log');
log(logFilePath)
ipcMain.on('log-message', (e, message) => {
  if (message && isDev())
    logOnFile(message)
})

const logOnFile = async (message) => {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!message) {
    // Crea un nuovo oggetto Error per ottenere lo stack trace
    const error = new Error();
    // Ottieni lo stack trace come stringa
    const stack = error.stack;
    // Dividi lo stack trace in linee
    const stackLines = stack?.split('\n');
    // Recupera la linea che contiene la chiamata alla funzione (la terza linea)
    const callerLine = stackLines?.[2].split('at ')[1];
    message = callerLine
  }
  fs.appendFile(logFilePath, message + '\n', (err) => {
    if (err) throw err;
  });
}

function deleteLogFile() {
  if (fs.existsSync(logFilePath)) {
    fs.rmSync(logFilePath);
  }
}
deleteLogFile()

//BEGIN APP
//get app parameter
const params = process.argv
if (params.includes('DEV=true')) {
  process.env['DEV'] = 'true'
}
log(params)

new AppController(app)
new NetworkController()
new AccountController(app)
let retryAppStart: NodeJS.Timeout | undefined = undefined
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
    PhoneIslandController.instance && PhoneIslandController.instance.reconnect()
  }, 500)
});

app.whenReady().then(async () => {
  //await resetApp()
  isDev() && log('APP READY')
  //I assign the app as usable for tel and callto protocol response
  protocol.handle('tel', (req) => {
    return handleTelProtocol(req.url)
  })
  protocol.handle('callto', (req) => {
    return handleTelProtocol(req.url)
  })

  protocol.handle('nethlink', (req) => {
    return handleNethLinkProtocol(req.url)
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
    setTimeout(startApp, 2500)
  })
  SplashScreenController.instance.show()
})

app.on('window-all-closed', () => {
  app.dock?.hide()
})

app.on('quit', () => {
  if (retryAppStart) {
    clearTimeout(retryAppStart)
  }
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
} else {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Print out data received from the second instance.
    log({ event, commandLine, workingDirectory, additionalData })
    const cmd = commandLine.pop()
    if (cmd) {
      log({ cmd })
      const regex = /(\w+):(?:\/\/?)?([^\/?]+(?:\/[^?]*)?(?:\?.*)?)/;
      const match = cmd.match(regex)
      log(match)
      if (match) {
        const [protocol, data] = [match[1], match[2]]
        log(protocol, data)
        switch (protocol) {
          case 'nethlink':
            handleNethLinkProtocol(data);
            break;
          case 'tel':
          case 'callto':
            handleTelProtocol(data);
            break;
        }
      }
    }
  })
}

nativeTheme.on('updated', () => {
  const theme = store.store['theme']
  const updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors
    ? 'dark'
    : 'light'

  if (store.store.account?.theme === 'dark' || store.store.account?.theme === 'light') {
    store.set('theme', store.store.account?.theme)
  } else {
    store.set('theme', updatedSystemTheme)
  }
  //update theme state on the store
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
    theme: 'system',
    connection: false
  })
  await delay(100)
  store.saveToDisk()
  await delay(100)
}

const startApp = async (attempt = 0) => {
  store.getFromDisk()
  //await delay(1500)
  if (!store.store.connection) {
    log('NO CONNECTION', attempt, store.store)
    if (attempt >= 3)
      SplashScreenController.instance.window.emit(IPC_EVENTS.SHOW_NO_CONNECTION)
    retryAppStart = setTimeout(() => {
      startApp(++attempt)
    }, 1000)
  } else {
    log('START APP', attempt, store.store)
    if (retryAppStart) {
      clearTimeout(retryAppStart)
    }
    const auth: AuthAppData | undefined = store.store['auth']
    await getPermissions()
    if (auth?.isFirstStart !== undefined && !auth?.isFirstStart) {
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
          theme: 'system',
          connection: store.store['connection'] || false
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
  if (LoginController.instance && LoginController.instance.window.isOpen()) {
    LoginController.instance.quit()
    AccountController.instance.saveLoggedAccount(store.store['account']!, password)
  }
  store.saveToDisk()
  createNethLink()
})

ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
  isDev() && log('logout from event')
  await PhoneIslandController.instance.logout()
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
  try {
    PhoneIslandController.instance.call(tel)
  } catch (e) {
    log(e)
  }
  return new Promise((resolve) => resolve)
}

function handleNethLinkProtocol(data: string): Promise<Response> {
  //we have to define the purpose of the nethlink custom protocol
  isDev() && log(data)
  //TODO: define actions
  try {
    NethLinkController.instance.show()
  } catch (e) {

  }
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


const createNethLink = async () => {
  registerShortcutForCall('CommandOrControl+c+F11')
  registerShortcutForCall('F11')
  await delay(500)
  new NethLinkController()
  NethLinkController.instance.show()
  await delay(1000)
  new PhoneIslandController()
  checkForUpdate()
}


const registerShortcutForCall = (shortcut) => {
  const getClipboardSelection = () => {
    return clipboard.readText('selection')
  }
  globalShortcut.register(shortcut, () => {
    const selection = getClipboardSelection()
    //log('clipboard:', selection)
    handleTelProtocol(selection)
  })
}
