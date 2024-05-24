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

//registro tutti gli eventi che la parte frontend emette verso il backend
registerIpcEvents()
let isFirstStart = true
let prevLoggedAccount: Account | undefined
let isOnResume = false
let windowsLoaded = 0

//imposto che l'app si debba aprire all'avvio del sistema operativo
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
  //const id = powerSaveBlocker.start('prevent-display-sleep')
  //console.log(powerSaveBlocker.isStarted(id))
  //
  //powerSaveBlocker.stop(id)

  //assegno l'app come utilizzabile per la la risposta ai protocolli tel e callto
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


  //Creo l'istanza del Tray controller - gli definisco la funzione che deve eseguire al click sull'icona
  log(process.env)
  isDev() && new DevToolsController()
  new SplashScreenController()
  new TrayController()

  //Visualizzo la splashscreen all'avvio dell'applicazione.
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

  //aspetto che tutte le finestre siano pronte o un max di 25 secondi
  let time = 0
  while (windowsLoaded <= 2 && time < 25) {
    await delay(100)
    time++
    //log(time, windowsLoaded)
  }
  await getPermissions()
  //log('call addOnBuildListener ')
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
  //una volta che il caricamento è completo abilito la possibilità di cliccare sull'icona nella tray
  TrayController.instance.enableClick = true
  //constollo se esiste il file di config (il file esiste solo se almeno un utente ha effettuato il login)
  if (AccountController.instance.hasConfigsFolderOfFile()) {
    //sia che riesco ad effettuare il login con il token sia che lo faccio con la pagina di login mi devo registrare a questo evento
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    try {
      //provo a loggare l'utente con il token che aveva
      await AccountController.instance.autologin()
    } catch (e) {
      AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
      LoginController.instance.show()
    } finally {
      //il caricamento è terminato, posso rimuovere la splashscreen
      //SplashScreenController.instance.hide()
      SplashScreenController.instance.window.hide()
    }
  } else {
    //il caricamento è terminato, posso rimuovere la splashscreen
    //SplashScreenController.instance.hide()
    SplashScreenController.instance.window.hide()
    //dichiaro cosa deve accadere quando l'utente effettua il login
    AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    LoginController.instance.show()
  }
}
const onAccountLogin = (account: Account) => {
  try {
    //loggo il nuovo accopunt sulla phone island
    PhoneIslandController.instance.login(account)
    //inizializzo la pagina di nethLink e avvio i fetch di history, speeddials e l'interval sugli operatori
    NethLinkController.instance.init(account)
    //quando l'utente cambia devo riloggarlo sulla phone island

    //controllo se ci sono aggiornamenti
    if (isFirstStart) {
      isFirstStart = false
      checkForUpdate()
    }
  } catch (e) {
    console.error(e)
  }
  AccountController.instance.removeEventListener('LOGIN', onAccountLogin)

  //essendomi loggato mi registro all'evento di logout
  AccountController.instance.addEventListener('LOGOUT', onAccountLogout)
}

const onAccountLogout = async (account: Account, isExit: boolean = false) => {
  //ormai mi sono sloggato quindi rimuovo il listener
  AccountController.instance.removeEventListener('LOGOUT', onAccountLogout)
  if (!isExit) {
    NethLinkController.instance.hide()
    AccountController.instance.addEventListener('LOGIN', onLoginFromLoginPage)
    AccountController.instance.addEventListener('LOGIN', onAccountLogin)
    LoginController.instance.show()
  }
}

const onLoginFromLoginPage = (account: Account) => {
  //log('Account', account.username, 'logged from login page')
  LoginController.instance.hide()
  AccountController.instance.removeEventListener('LOGIN', onLoginFromLoginPage)
}

const checkForUpdate = async () => {
  const latestVersionData = await NetworkController.instance.get(`https://api.github.com/repos/nethesis/nethlink/releases/latest`)
  log(app.getVersion())
  if (latestVersionData.name !== app.getVersion()) {
    NethLinkController.instance.sendUpdateNotification()
  }
}

app.on('window-all-closed', () => {
  app.dock?.hide()
  //i18nextBackend.clearMainBindings(ipcMain);
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

