import { app, nativeTheme, powerMonitor, protocol, shell, systemPreferences } from 'electron'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController, DevToolsController } from './classes/controllers'
import { PhoneIslandController } from './classes/controllers/PhoneIslandController'
import { Account, AvailableThemes } from '@shared/types'
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
new AppController(app)
new NetworkController()
new AccountController(app)

//log all events that the frontend part issues to the backend
registerIpcEvents()
let isFirstStart = true
let prevLoggedAccount: Account | undefined
let isOnResume = false
let windowsLoaded = 0

//I set the app to open at operating system startup
app.setLoginItemSettings({
  openAtLogin: true
})

powerMonitor.on('suspend', () => {
  if (!prevLoggedAccount) {
    isOnResume = false
    const account = AccountController.instance.getLoggedAccount()
    if (account) {
      prevLoggedAccount = account
      NethLinkController.instance.hide()
      PhoneIslandController.instance.hidePhoneIsland()
    } else {
      LoginController.instance.hide()
    }
    log('suspend')
    AccountController.instance.removeEventListener('LOGOUT', onAccountLogout)
    AccountController.instance.removeEventListener('LOGIN', onAccountLogin)
    AccountController.instance.removeEventListener('LOGIN', onLoginFromLoginPage)
  }
});

powerMonitor.on('resume', async () => {
  if (!isOnResume) {
    isOnResume = true
    log('resume')

    if (prevLoggedAccount) {
      NethLinkController.instance.hide()
      PhoneIslandController.instance.hidePhoneIsland()
      await AccountController.instance.logout(true)
      AccountController.instance.addEventListener('LOGIN', onAccountLogin)
      AccountController.instance.addEventListener('LOGOUT', onAccountLogout)
      await AccountController.instance.autologin()
      prevLoggedAccount = undefined
    } else {
      LoginController.instance.hide()
      AccountController.instance.addEventListener('LOGIN', onAccountLogin)
      AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
      setTimeout(() => {
        LoginController.instance.show()
      }, 5000)
    }
  }
});

app.whenReady().then(async () => {
  log('APP READY')
  //I assign the app as usable for tel and callto protocol response
  protocol.handle('tel', (req) => {
    return handleTelProtocol(req.url)
  })
  protocol.handle('callto', (req) => {
    return handleTelProtocol(req.url)
  })

  protocol.handle('nethlink', (req) => {
    log(req)
    return new Promise((resolve) => resolve)

  })


  //I create the Tray controller instance - I define to it the function it should execute upon clicking on the icon
  log(process.env)
  isDev() && new DevToolsController()
  new SplashScreenController()
  new TrayController()

  //I display the splashscreen when I start the application.
  SplashScreenController.instance.window.addOnBuildListener(startApp)
})

const startApp = async () => {
  SplashScreenController.instance.show()
  new PhoneIslandController()
  new NethLinkController()
  new LoginController()
  const updateBuildedWindows = () => windowsLoaded++
  PhoneIslandController.instance.window.addOnBuildListener(updateBuildedWindows)
  NethLinkController.instance.window.addOnBuildListener(updateBuildedWindows)
  LoginController.instance.window.addOnBuildListener(updateBuildedWindows)

  //I wait until all windows are ready or a maximum of 25 seconds
  let time = 0
  while (windowsLoaded <= 2 && time < 25) {
    await delay(100)
    time++
  }
  await getPermissions()
  nativeTheme.on('updated', () => {
    const updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors
      ? 'dark'
      : 'light'
    debouncer(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, () => {
      PhoneIslandController.instance.window.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
      NethLinkController.instance.window.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
      LoginController.instance.window.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
      DevToolsController.instance?.window?.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
      TrayController.instance.changeIconByTheme(updatedSystemTheme)
    })
  })
  //once the loading is complete I enable the ability to click on the icon in the tray
  TrayController.instance.enableClick = true
  //I check if the config file exists (the file exists only if at least one user is logged in)
  if (AccountController.instance.hasConfigsFolderOfFile()) {
    //whether I can login with the token or with the login page I have to register for this event
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    try {
      //I try to log the user in with the token he had
      await AccountController.instance.autologin()
    } catch (e) {
      AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
      LoginController.instance.show()
    } finally {
      //loading has finished, I can remove the splashscreen
      SplashScreenController.instance.window.hide()
    }
  } else {
    //loading has finished, I can remove the splashscreen
    SplashScreenController.instance.window.hide()
    //I declare what should happen when the user logs in
    AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    LoginController.instance.show()
  }
}
const onAccountLogin = (account: Account) => {
  try {
    //I log the new account on the phone island
    PhoneIslandController.instance.login(account)
    //I initialize the nethLink page and start fetching history, speeddials and the interval on the operators
    NethLinkController.instance.init(account)
    //when the user changes I have to relocate it to the phone island

    //check for updates
    if (isFirstStart) {
      isFirstStart = false
      checkForUpdate()
    }
  } catch (e) {
    console.error(e)
  }
  AccountController.instance.removeEventListener('LOGIN', onAccountLogin)

  //having logged in I log out event
  AccountController.instance.addEventListener('LOGOUT', onAccountLogout)
}

const onAccountLogout = async (account: Account, isExit: boolean = false) => {
  //by now I have logged off so I remove the listener
  AccountController.instance.removeEventListener('LOGOUT', onAccountLogout)
  if (!isExit) {
    NethLinkController.instance.hide()
    AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    LoginController.instance.show()
  }
}

const onLoginFromLoginPage = (account: Account) => {
  LoginController.instance.hide()
  AccountController.instance.removeEventListener('LOGIN', onLoginFromLoginPage)
}

const checkForUpdate = async () => {
  const latestVersionData = await NetworkController.instance.get(`https://api.github.com/repos/nethesis/nethlink/releases/latest`)
  log(app.getVersion())
  if (latestVersionData.name !== app.getVersion() || isDev()) {
    NethLinkController.instance.sendUpdateNotification()
  }
}

app.on('window-all-closed', () => {
  app.dock?.hide()
})



app.on('quit', () => {
  log('quit')
  const account = AccountController.instance.getLoggedAccount()
  if (account) {
    onAccountLogout(account, true)
  }
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

