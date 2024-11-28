import { app, clipboard, globalShortcut, ipcMain, nativeTheme, powerMonitor, protocol, systemPreferences } from 'electron'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { AuthAppData, AvailableThemes } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { LoginController } from './classes/controllers/LoginController'
import { join, resolve } from 'path'
import { log } from '@shared/utils/logger'
import { NethLinkController } from './classes/controllers/NethLinkController'
import { SplashScreenController } from './classes/controllers/SplashScreenController'
import { debouncer, delay, isDev } from '@shared/utils/utils'
import { IPC_EVENTS, GIT_RELEASES_URL } from '@shared/constants'
import { NetworkController } from './classes/controllers/NetworkController'
import { AppController } from './classes/controllers/AppController'
import { store } from './lib/mainStore'
import fs from 'fs'
import path from 'path'
import i18next from 'i18next'
import Backend from 'i18next-fs-backend/cjs'
import { uniq } from 'lodash'
import { Registry } from 'rage-edit';


//get app parameter
const params = process.argv
if (params.includes('DEV=true')) {
  process.env['DEV'] = 'true'
}
log(params)

function startup() {
  //windows
  //verifico che questa sia l'unica istanza attiva
  const gotTheLock = app.requestSingleInstanceLock()
  log('gotTheLock', gotTheLock)

  if (!gotTheLock) {
    log('Block second instance')
    app.quit()
    return;
  } else {

    //I set the app to open at operating system startup
    if (process.env.node_env !== 'development') {
      app.setLoginItemSettings({
        openAtLogin: true
      })
    }

    ///LOGGER
    startLogger()

    ipcMain.on(IPC_EVENTS.EMIT_START_CALL, async (_event, phoneNumber) => {
      PhoneIslandController.instance.call(phoneNumber)
    })
    ipcMain.on(IPC_EVENTS.LOGIN, async (e, props?: { password?: string, showNethlink: boolean }) => {
      const { password, showNethlink } = props || { showNethlink: true }
      if (LoginController.instance && LoginController.instance.window.isOpen() && password) {
        log("LOGIN SUCCESS")
        await LoginController.instance.quit()
        AccountController.instance.saveLoggedAccount(store.store['account']!, password)
      }
      store.saveToDisk()
      createNethLink(showNethlink)
    })

    ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
      log('logout from event')
      await PhoneIslandController.instance.logout()
      NethLinkController.instance.logout()
      AccountController.instance.logout()
      await delay(1000)
      TrayController.instance.updateTray({
        enableShowButton: true
      })
      showLogin()
    })

    getPermissions()

    attachOnReadyProcess()

    attachThemeChangeListener()
    attachPowerMonitor()

    app.dock?.hide()
  }

}

async function startLocalization() {

  const convertPath = (filename): string => {
    let dir = __dirname
    log({ dir })
    let loadPath = join(`./public/locales/{{lng}}/${filename}.json`)
    if (__dirname.includes('.asar')) {
      loadPath = join(dir, `../renderer/locales/{{lng}}/${filename}.json`)
    }
    return loadPath
  }

  const getI18nLoadPath = (): string => convertPath('translations')

  const fallbackLng = ['en']
  const loadPath = getI18nLoadPath()
  const config: any = {
    backend: {
      debug: isDev(),
      loadPath,
    },
    fallbackLng,
    debug: isDev(),
  }
  const electronDetector: any = {
    type: 'languageDetector',
    async: false,
    init: Function.prototype,
    detect: () => {
      const locale = app.getSystemLocale()
      const locales = uniq([locale!.split('-')[0], ...fallbackLng])
      return locales
    },
    cacheUserLanguage: Function.prototype
  }

  log(config)
  await i18next.use(Backend).use(electronDetector).init(config)
}
function startLogger() {
  const logFilePath = path.join(app.getPath("userData"), './logs/app.log');
  log(logFilePath)
  const logOnFile = async (message) => {
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!message) {
      // Create new object error to get stack trace
      const error = new Error();
      // Get stack trace as string
      const stack = error.stack;
      // Divide stack trace in lines
      const stackLines = stack?.split('\n');
      // Get the line contains function call (the third one)
      const callerLine = stackLines?.[2].split('at ')[1];
      message = callerLine
    }
    fs.appendFile(logFilePath, message + '\n', (err) => {
      if (err) throw err;
    });
    isDev() && console.log(message)
  }
  ipcMain.on('log-message', (e, message) => {
    if (message && isDev())
      logOnFile(message)
  })

  function deleteLogFile() {
    if (fs.existsSync(logFilePath)) {
      fs.rmSync(logFilePath);
    }
  }
  deleteLogFile()
}

function attachOnReadyProcess() {
  new AppController(app)
  new NetworkController()
  new AccountController(app)

  registerIpcEvents()

  let retryAppStart: NodeJS.Timeout | undefined = undefined

  app.whenReady().then(async () => {
    log('APP READY')
    await startLocalization()

    //I create the Tray controller instance - I define to it the function it should execute upon clicking on the icon
    new SplashScreenController()
    new TrayController()

    //I display the splashscreen when the splashscreen component is correctly loaded.
    SplashScreenController.instance.window.addOnBuildListener(() => {
      setTimeout(startApp, 2500)
    })
    await attachProtocolListeners()

    app.on('activate', (e, isWindowOpen) => {
      log('ACTIVATE WINDOW', e, isWindowOpen)
      if (!isWindowOpen && !NethLinkController.instance.window.isOpen()) {
        NethLinkController.instance.show()
      }
    })
    SplashScreenController.instance.show()

    if (isDev()) {
      const events: string[] = [
        'accessibility-support-changed',
        'activity-was-continued', 'before-quit', 'browser-window-blur', 'browser-window-created', 'browser-window-focus', 'certificate-error', 'child-process-gone', 'continue-activity', 'continue-activity-error', 'did-become-active', 'gpu-info-update', 'gpu-process-crashed', 'login', 'new-window-for-tab', 'open-file', 'render-process-gone', 'renderer-process-crashed', 'select-client-certificate',
        'session-created', 'update-activity-state', 'web-contents-created', 'will-continue-activity', 'will-finish-launching', 'will-quit'
      ]
      events.forEach((e: any) => {
        app.on(e, (...args) => {
          log(`APP-EVENT ${e}`, args)
        })
      })
    }
  })

  async function startApp(attempt = 0) {
    let data = store.store || store.getFromDisk()
    if (!checkData(data)) {
      if (attempt === 0) {
        data = store.getFromDisk()
        store.updateStore(data, 'startApp')
        startApp(++attempt)
        return;
      } else {
        await resetApp()
        showLogin()
        SplashScreenController.instance.window.quit(true)
        //once the loading is complete I enable the ability to click on the icon in the tray
        TrayController.instance.updateTray({
          enableShowButton: true
        })
      }

    } else {
      await checkConnection()
      log('START APP, retry:', attempt)
      if (!store.store.connection) {
        log('NO CONNECTION', attempt, store.store)
        if (attempt >= 3)
          SplashScreenController.instance.window.emit(IPC_EVENTS.SHOW_NO_CONNECTION)

        retryAppStart = setTimeout(() => {
          startApp(++attempt)
        }, 1000)
      } else {
        if (retryAppStart) {
          clearTimeout(retryAppStart)
        }
        const auth: AuthAppData | undefined = store.store['auth']
        await getPermissions()
        if (auth?.isFirstStart !== undefined && !auth?.isFirstStart) {
          const isLastUserLogged = await AccountController.instance.autoLogin()
          if (isLastUserLogged) {
            ipcMain.emit(IPC_EVENTS.LOGIN, undefined, { showNethlink: true })
          } else {
            store.updateStore({
              auth: {
                ...store.store['auth']!,
                lastUser: undefined,
                lastUserCryptPsw: undefined
              },
              account: undefined,
              theme: 'system',
              connection: store.store['connection'] || false,
            }, 'showLogin')
            showLogin()
          }
        } else {
          await resetApp()
          showLogin()
        }
        SplashScreenController.instance.window.quit(true)
        //once the loading is complete I enable the ability to click on the icon in the tray
        TrayController.instance.updateTray({
          enableShowButton: true
        })
      }
    }
  }

  app.on('window-all-closed', () => {
    app.dock?.hide()
  })
  app.on('quit', () => {
    if (retryAppStart) {
      clearTimeout(retryAppStart)
    }
    log('quit')
  })
}

async function registryProtocol(protocol: string) {
  const AppName = app.getName();

  await Registry.set(`HKCU\\Software\\${AppName}\\Capabilities`, 'ApplicationName', AppName);
  await Registry.set(`HKCU\\Software\\${AppName}\\Capabilities`, 'ApplicationDescription', AppName);

  await Registry.set(`HKCU\\Software\\${AppName}\\Capabilities\\URLAssociations`, protocol, `${AppName}.${protocol}`);

  await Registry.set(`HKCU\\Software\\Classes\\${AppName}.${protocol}\\DefaultIcon`, '', process.execPath);

  await Registry.set(`HKCU\\Software\\Classes\\${AppName}.${protocol}\\shell\\open\\command`, '', `"${process.execPath}" "%1"`);

  await Registry.set(`HKCU\\Software\\RegisteredApplications`, AppName, `Software\\${AppName}\\Capabilities`);

}

async function removeRegistryProtocol(protocol: string) {
  const AppName = app.getName();

  await Registry.delete(`HKCU\\Software\\${AppName}`);

  await Registry.delete(`HKCU\\Software\\Classes\\${AppName}.${protocol}`);

  await Registry.delete(`HKCU\\Software\\RegisteredApplications`, AppName);

}

async function attachProtocolListeners() {
  if (process.env.node_env === 'development') {
    // remove so we can register each time as we run the app.
    if (process.platform === 'win32') {
      await removeRegistryProtocol('tel')
      await removeRegistryProtocol('callto')
      await removeRegistryProtocol('nethlink')
    } else {
      app.removeAsDefaultProtocolClient('tel')
      app.removeAsDefaultProtocolClient('callto')
      app.removeAsDefaultProtocolClient('nethlink')

    }
  }
  if (process.platform === 'win32') {
    await registryProtocol('tel')
    await registryProtocol('callto')
    await registryProtocol('nethlink')
  }

  // if we are running a non-packaged version of the app && on windows
  const res: { [protocol: string]: boolean } = {}
  if (process.env.node_env === 'development' && process.argv.length > 2) {
    log(process.argv.join('; '))
    // set the path of electron.exe and your app.
    // these two additional parameters are only available on windows.
    res['tel'] = app.setAsDefaultProtocolClient('tel', process.execPath, [resolve(process.argv[1])])
    res['callto'] = app.setAsDefaultProtocolClient('callto', process.execPath, [resolve(process.argv[1])])
    res['nethlink'] = app.setAsDefaultProtocolClient('nethlink', process.execPath, [resolve(process.argv[1])])
  } else {
    res['tel'] = app.setAsDefaultProtocolClient('tel')
    res['callto'] = app.setAsDefaultProtocolClient('callto')
    res['nethlink'] = app.setAsDefaultProtocolClient('nethlink')

  }
  log('associated protocols:', res)

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

  app.on('open-url', (ev, origin) => {
    handleTelProtocol(origin)
  })

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

  function handleTelProtocol(url: string): Promise<Response> {
    const regex = /(\+?\*?\d+)/;
    const match = url.match(regex)
    log(url, match)
    if (match) {
      log('TEL:', match[0])
      try {
        PhoneIslandController.instance.call(match[0])
      } catch (e) {
        log(e)
      }
    }
    return new Promise((resolve) => resolve)
  }

  function handleNethLinkProtocol(data: string): Promise<Response> {
    //we have to define the purpose of the nethlink custom protocol
    log(data)
    //TODO: define actions
    try {
      NethLinkController.instance.show()
    } catch (e) {

    }
    return new Promise((resolve) => resolve)
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

}

function attachPowerMonitor() {
  //Define how the nethlink have to manage the power suspend and after the power resume events
  powerMonitor.on('suspend', onAppSuspend);
  powerMonitor.on('resume', onAppResume);
  powerMonitor.on('shutdown', onAppShutdown)


  async function onAppShutdown() {
    log('APP POWER SHUTDOWN')
    await AppController.safeQuit()
  }

  async function onAppSuspend() {
    store.saveToDisk()
    log('APP POWER SUSPEND')
  }

  async function onAppResume() {
    debouncer('onAppResume', async () => {
      const data = store.getFromDisk()
      store.updateStore(data, 'onAppResume')
      log('APP POWER RESUME')
      let showNethlink = true
      if (store.store['account'] && NethLinkController.instance) {
        const isOpen = NethLinkController.instance.window.isOpen()
        showNethlink = isOpen ?? true
        await PhoneIslandController.instance.logout()
        NethLinkController.instance.logout()
        const autoLoginResult = await AccountController.instance.autoLogin()
        if (autoLoginResult) {
          ipcMain.emit(IPC_EVENTS.LOGIN, undefined, { showNethlink })
        }
      }

    }, 2000)
  }
}

function attachThemeChangeListener() {
  nativeTheme.on('updated', () => {
    if (store.store) {
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
      TrayController.instance?.changeIconByTheme(updatedSystemTheme)
    }
  })
}
/**
 * CAUTION!! this function will destroy all current persistant data. use it only if absolutely necessary
 */
async function resetApp() {
  const availableAccounts = store.getAvailableFromDisk()
  store.updateStore({
    account: undefined,
    auth: {
      availableAccounts: availableAccounts,
      isFirstStart: Object.keys(availableAccounts).length === 0,
      lastUser: undefined,
      lastUserCryptPsw: undefined
    },
    theme: 'system',
    connection: true,
  }, 'resetApp')
  await delay(100)
  store.saveToDisk()
  await delay(100)
}

async function getPermissions() {
  if (process.platform === 'darwin') {
    const cameraPermissionState = systemPreferences.getMediaAccessStatus('camera')
    const cameraPermission = await systemPreferences.askForMediaAccess('camera')
    const microphonePermissionState = systemPreferences.getMediaAccessStatus('microphone')
    const microphonePermission = await systemPreferences.askForMediaAccess('microphone')
    log(
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

function showLogin() {
  new LoginController()
  store.saveToDisk()
  setTimeout(() => {
    log('show login', store.store)
    LoginController.instance.show()
  }, 100)
}

async function createNethLink(show: boolean = true) {
  await delay(500)
  new NethLinkController()
  await delay(250)
  if (show)
    NethLinkController.instance.show()
  await delay(1000)
  new PhoneIslandController()
  checkForUpdate()
}

async function checkForUpdate() {
  const latestVersionData = await NetworkController.instance.get(GIT_RELEASES_URL)
  log(app.getVersion())
  if (latestVersionData.name !== app.getVersion() || isDev()) {
    NethLinkController.instance.sendUpdateNotification()
  }
}

function checkData(data: any): boolean {
  log('checkData', { data })
  return data?.hasOwnProperty('auth') &&
    data?.hasOwnProperty('theme') &&
    data?.hasOwnProperty('connection')
}

async function checkConnection() {
  const connected = await new Promise((resolve) => {
    NetworkController.instance.get(GIT_RELEASES_URL).then(() => {
      resolve(true)
    }).catch(() => {
      resolve(false)
    })
  })
  log("checkConnection:", { connected, connection: store.store.connection })
  if (connected !== store.store.connection) {
    ipcMain.emit(IPC_EVENTS.UPDATE_CONNECTION_STATE, undefined, connected);
  }
}

//BEGIN APP
startup()

