import { app, ipcMain, nativeTheme, powerMonitor, protocol, systemPreferences, dialog, shell, globalShortcut } from 'electron'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account, AuthAppData, AvailableThemes } from '@shared/types'
import { TrayController } from './classes/controllers/TrayController'
import { LoginController } from './classes/controllers/LoginController'
import { join, resolve } from 'path'
import { Log } from '@shared/utils/logger'
import { NethLinkController } from './classes/controllers/NethLinkController'
import { SplashScreenController } from './classes/controllers/SplashScreenController'
import { delay, isDev } from '@shared/utils/utils'
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
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { URL } from 'url'

//get app parameter
const params = process.argv
for (const arg of params) {
  if (arg.includes('=')) {
    const kv: any[] = arg.split('=')
    if (['DEV', 'DEVTOOLS', 'DEBUG'].includes(kv[0])) {
      kv[1] = kv[1] === 'true'
    }
    // } else {
    //   kv[1] = undefined
    // }
    if (kv[1])
      process.env[kv[0]] = kv[1]
  }
}
const multipleInstances = !!process.env['INSTANCE']
process.env['APP_VERSION'] = app.getVersion()
Log.debug('ENV:', process.env)

function startup() {
  app.setName('NethLink')
  //if (isDev())
  app.setAppUserModelId(app.getName()) //add app name to the notification title
  ///LOGGER
  startLogger()

  //windows
  const gotTheLock = multipleInstances || app.requestSingleInstanceLock()
  Log.info('gotTheLock', gotTheLock)

  if (!gotTheLock) {
    Log.info('Block second instance')
    app.quit()
    return;
  } else {

    //I set the app to open at operating system startup
    if (process.env.node_env !== 'development' && !isDev()) {
      app.setLoginItemSettings({
        openAtLogin: true
      })
    }

    ipcMain.on(IPC_EVENTS.LOGIN, async (e, props?: { account?: Account, password?: string, showNethlink: boolean, }) => {
      const { password, showNethlink, account } = props || { showNethlink: true }
      if (LoginController.instance && LoginController.instance.window.isOpen() && password && account) {
        Log.info("LOGIN SUCCESS")
        await LoginController.instance.quit()
        AccountController.instance.saveLoggedAccount(account, password)
      }
      store.saveToDisk()
      createNethLink(showNethlink)
    })

    ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
      Log.info('logout from event')
      await PhoneIslandController.instance.logout()
      NethLinkController.instance.logout()
      AccountController.instance.logout()
      await delay(1000)
      TrayController.instance.updateTray({
        enableShowButton: true
      })
      showLogin()
    })

    ipcMain.on(IPC_EVENTS.RESUME, async (_event) => {
      Log.info('logout after resume event')
      onAppResume()
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
    const dir = __dirname
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

  Log.info(config)
  await i18next.use(Backend).use(electronDetector).init(config)
}
function startLogger() {
  const today = new Date().toISOString().split('T')[0];
  const logFilePath = path.join(app.getPath("userData"), `./logs/app_${today}_${store.assignedInstanceID}.log`);
  const logOnFile = async (message) => {
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      fs.appendFile(logFilePath, `App Version: ${app.getVersion()}\n`, (err) => {
        if (err) throw err;
      });
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
    let isGone = false
    Log.info('APP READY')
    await startLocalization()

    //I create the Tray controller instance - I define to it the function it should execute upon clicking on the icon
    new SplashScreenController()
    new TrayController()

    //I display the splashscreen when the splashscreen component is correctly loaded.
    SplashScreenController.instance.window.addOnBuildListener(() => {
      setTimeout(startApp, 1000)
    })
    await attachProtocolListeners()

    app.on('activate', (e, isWindowOpen) => {
      Log.info('ACTIVATE WINDOW', e, isWindowOpen)
      if (!isWindowOpen && !NethLinkController.instance.window.isOpen()) {
        NethLinkController.instance.show()
      }
    })
    SplashScreenController.instance.show()
    app.on('render-process-gone', async (...args) => {
      Log.info('render-process-gone', args)
    })

    if (isDev() && process.env['DEBUG']) {
      const events: string[] = [
        'accessibility-support-changed',
        'activity-was-continued',
        'before-quit',
        'browser-window-blur',
        'browser-window-created',
        'browser-window-focus',
        'certificate-error',
        'child-process-gone',
        'continue-activity',
        'continue-activity-error',
        'did-become-active',
        'gpu-info-update',
        'login',
        'new-window-for-tab',
        'open-file',
        'select-client-certificate',
        'session-created',
        'update-activity-state',
        'web-contents-created',
        'will-continue-activity',
        'will-finish-launching',
        'will-quit'
      ]
      events.forEach((e: any) => {
        app.on(e, (...args) => {
          Log.info(`APP-EVENT ${e}`, args)
        })
      })
    }

    // read shortcut from config and set it to app
    const account: Account = store.get('account') as Account
    Log.info("Shortcut readed:", store.get('shortcut'), account.shortcut)
    if(account.shortcut && account.shortcut?.length > 0) {
      ipcMain.emit(IPC_EVENTS.CHANGE_SHORTCUT, undefined, account.shortcut)
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
      const isOnline = await checkConnection()
      Log.info('START - START APP, retry:', attempt)
      if (!isOnline) {
        Log.info('START - NO CONNECTION', attempt, store.store)
        if (attempt >= 3) {
          try {
            SplashScreenController.instance.window.emit(IPC_EVENTS.SHOW_NO_CONNECTION)
          } catch (e) {
            Log.error(e)
          }
        }

        retryAppStart = setTimeout(() => {
          startApp(++attempt)
        }, 1000)
      } else {
        if (retryAppStart) {
          clearTimeout(retryAppStart)
        }
        const auth: AuthAppData | undefined = store.store.auth
        Log.info('START - request permissions')
        await getPermissions()
        if (auth?.isFirstStart !== undefined && !auth?.isFirstStart) {
          Log.info('START - try autologin')
          const isLastUserLogged = await AccountController.instance.autoLogin()
          if (isLastUserLogged) {
            Log.info('START - autologin success')
            ipcMain.emit(IPC_EVENTS.LOGIN, undefined, { showNethlink: true })
          } else {
            Log.info('START - autologin failed')
            store.updateStore({
              auth: {
                ...store.store.auth!,
                lastUser: undefined,
                lastUserCryptPsw: undefined
              },
              account: undefined,
              theme: 'system',
              connection: store.store.connection || false,
              accountStatus: 'offline',
              isCallsEnabled: false,
              lastDevice: undefined
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
  app.on('before-quit', async (e) => {
    e.preventDefault();
    if (retryAppStart) {
      clearTimeout(retryAppStart)
    }

    const account: Account = store.get('account') as Account
    const ext = account.data?.endpoints.extension.find((e) => e.type === "webrtc") || account.data?.endpoints.extension.find((e) => e.type === "physical")
    if (ext) {
      const { NethVoiceAPI } = useNethVoiceAPI(account)
      const res = await NethVoiceAPI.User.default_device(ext)
      Log.info('Reset device', res, ext.type, ext.id)
    }

    // read shortcut from config and unregister
    Log.info("Unregister all shortcuts")
    await globalShortcut.unregisterAll()

    Log.info('APP QUIT CORRECTLY')
    app.exit();
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
    Log.info('attachProtocolListeners:', process.argv.join('; '))
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
  Log.info('associated protocols:', res)

  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // Print out data received from the second instance.
    const cmd = commandLine.pop()
    Log.info('SECOND INSTANCE', { event, commandLine, workingDirectory, additionalData, cmd })
    if (!multipleInstances) {
      if (cmd) {
        const regex = /(\w+):(?:\/\/?)?([^\/?]+(?:\/[^?]*)?(?:\?.*)?)/;
        const match = cmd.match(regex)
        if (match) {
          const [protocol, data] = [match[1], match[2]]
          switch (protocol) {
            case 'nethlink':
              handleNethLinkProtocol(data);
              break;
            case 'tel':
            case 'callto':
              handleStartCallProtocols(data);
              break;
          }
        }
      }
    }
  })

  app.on('open-url', (ev, origin) => {
    handleOpenUrlProtocols(origin)
  })

  //I assign the app as usable for tel and callto protocol response
  protocol.handle('tel', (req) => {
    return handleStartCallProtocols(req.url)
  })
  protocol.handle('callto', (req) => {
    return handleStartCallProtocols(req.url)
  })

  protocol.handle('nethlink', (req) => {
    return handleNethLinkProtocol(req.url)
  })

  function handleOpenUrlProtocols(url: string) {
    const regex = /(\w+):(?:\/\/?)?([^\/?]+(?:\/[^?]*)?(?:\?.*)?)/;
    const match = url.match(regex)
    if (match) {
      const [protocol, data] = [match[1], match[2]]
      switch (protocol) {
        case 'nethlink':
          handleNethLinkProtocol(data);
          break;
        case 'tel':
        case 'callto':
          handleStartCallProtocols(data);
          break;
      }
    }
  }

  function handleStartCallProtocols(url: string): Promise<Response> {
    const regex = /(\+?\*?\d+)/;
    const match = url.match(regex)
    if (match) {
      Log.info('HandleProtocol TEL/CALLTO:', match[0])
      PhoneIslandController.instance.call(match[0])
    }
    return new Promise((resolve) => resolve)
  }

  function handleNethLinkProtocol(url: string): Promise<Response> {
    //we have to define the purpose of the nethlink custom protocol
    Log.info('HandleProtocol Nethlink:', url)
    const data = new URL("nethlink://" + url)

    const action = data.host
    try {
      switch (action) {
        case 'transfer':
          const to = data.searchParams.get('to')
          if (to)
            PhoneIslandController.instance.callTransfer(to)
          break;
      }
      NethLinkController.instance.show()
    } catch (e) {
      Log.error('HandleProtocol Nethlink:', e)
    }
    return new Promise((resolve) => resolve)
  }
}

function attachPowerMonitor() {
  //Define how the nethlink have to manage the power suspend and after the power resume events
  powerMonitor.on('suspend', onAppSuspend);
  powerMonitor.on('resume', onAppResume);
  powerMonitor.on('unlock-screen', onAppResume);
  powerMonitor.on('shutdown', onAppShutdown)
}

async function onAppShutdown() {
  Log.info('APP POWER SHUTDOWN')
  await AppController.safeQuit()
}

async function onAppSuspend() {
  store.saveToDisk()
  Log.info('APP POWER SUSPEND')
}

let isInPowerResume = false
async function onAppResume() {
  Log.info('TRY APP POWER RESUME', { isInPowerResume })
  if (!isInPowerResume) {
    isInPowerResume = true
    const data = store.getFromDisk()
    store.updateStore(data, 'onAppResume')
    Log.info('APP POWER RESUME')
    let showNethlink = true
    if (store.store.account && NethLinkController.instance) {
      const autoLoginResult = await AccountController.instance.autoLogin()
      if (autoLoginResult) {
        NethLinkController.instance.window.getWindow()?.reload()
        await delay(500)
        PhoneIslandController.instance.window.getWindow()?.reload()
      }
    }
    isInPowerResume = false
  }
}

function changeNethlinkTheme() {
  let updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors
    ? 'dark'
    : 'light'

  //set nethlink pages theme
  if (store.store) {
    if (store.store.account?.theme === 'dark' || store.store.account?.theme === 'light') {
      store.set('theme', store.store.account?.theme)
    } else {
      store.set('theme', updatedSystemTheme)
    }
  }

  //se tray icon theme based on system settings

  if (process.platform === 'win32') {
    Registry.get(`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize`, 'SystemUsesLightTheme').then((system) => {
      Log.info('THEME CHANGE SYSTEM', system)
      const theme = system === 1 ? 'light' : 'dark'
      TrayController.instance?.changeIconByTheme(theme)
    }).catch((e) => {
      Log.error(e)
      TrayController.instance?.changeIconByTheme('dark')
    });
  } else {
    TrayController.instance?.changeIconByTheme(updatedSystemTheme)
  }
}

function attachThemeChangeListener() {

  changeNethlinkTheme()
  nativeTheme.on('updated', () => {
    changeNethlinkTheme()
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
    lastDevice: undefined,
    accountStatus: 'offline',
    isCallsEnabled: false
  }, 'resetApp')
  await delay(100)
  store.saveToDisk()
  await delay(100)
}

async function getPermissions() {
  if (process.platform === 'darwin') {
    //if permission has already been granted I disabled another request to improve performance
    let cameraPermission = true
    const cameraPermissionState = systemPreferences.getMediaAccessStatus('camera')
    if (cameraPermissionState !== 'granted') {
      cameraPermission = await systemPreferences.askForMediaAccess('camera')
    }

    let microphonePermission = true
    const microphonePermissionState = systemPreferences.getMediaAccessStatus('microphone')
    if (microphonePermissionState !== 'granted') {
      microphonePermission = await systemPreferences.askForMediaAccess('microphone')
    }

    let recordScreenPermission = true
    const recordScreenPermissionState = systemPreferences.getMediaAccessStatus('screen')
    if (recordScreenPermissionState !== 'granted') {
      recordScreenPermission = false
      dialog.showMessageBox({
        type: 'warning',
        title: i18next.t('Common.Screen share dialog title') || 'Screen share',
        message: i18next.t('Common.Screen share dialog description'),
        buttons: [
          i18next.t('Common.Cancel button') || 'Cancel',
          i18next.t('Common.Open settings button') || 'Open Settings'
        ],
        defaultId: 1,
        cancelId: 0
      }).then(result => {
        if (result.response === 1) {
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenRecording');
        }
      });
    }

    // used for copy&paste for shortcut call
    let accessibilityPermission = true
    const accessibilityPermissionState = systemPreferences.isTrustedAccessibilityClient(true);
    if (!accessibilityPermissionState) {
      accessibilityPermission = false
    }

    Log.info(
      'START - acquired permissions:',
      {
        cameraPermissionState,
        cameraPermission,
        microphonePermissionState,
        microphonePermission,
        recordScreenPermission,
        recordScreenPermissionState,
        accessibilityPermissionState,
        accessibilityPermission
      }
    )
  }
}

function showLogin() {
  new LoginController()
  store.saveToDisk()
  setTimeout(() => {
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
  Log.info('Current app version:', app.getVersion(), 'check for updates...')
  const latestVersionData = await NetworkController.instance.get(GIT_RELEASES_URL)
  Log.info('Head add version:', latestVersionData.name)
  if (latestVersionData.name !== ("v"+app.getVersion()) || isDev()) {
    NethLinkController.instance.sendUpdateNotification()
  }
}

function checkData(data: any): boolean {
  const isValid = data?.hasOwnProperty('auth') &&
    data?.hasOwnProperty('theme') &&
    data?.hasOwnProperty('connection')
  Log.info('Check if app data is valid:', isValid)
  return isValid

}

async function checkConnection() {
  const connected = await new Promise((resolve) => {
    NetworkController.instance.get('https://google.com', {} as any).then(() => {
      resolve(true)
    }).catch(() => {
      resolve(false)
    })
  })
  Log.debug("checkConnection:", { connected, connection: store.store.connection })
  if (connected !== store.store.connection) {
    ipcMain.emit(IPC_EVENTS.UPDATE_CONNECTION_STATE, undefined, connected);
  }
  return connected
}

//BEGIN APP
startup()
