import { app } from 'electron'
import { AccountController, LoginConfigWindow, SplashScreenWindow, TrayGenerator } from '@/classes'
import { registerIpcEvents } from './lib/ipcEvents'
import { Account } from '@shared/types'

new AccountController(app)
const AC = AccountController.instance
registerIpcEvents()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  //app.setAppUserModelId('com.electron')

  //check the presence of config file in appdata folder
  AC.onAccountChange((account: Account) => {
    console.log(account)
    try {
      loginWindow.close()
    } catch (e) {
      console.log(e)
    }
    showTray()
  })
  const loginWindow = new LoginConfigWindow()
  if (AC.hasConfigsFolder()) {
    new SplashScreenWindow(() => {
      loginWindow.show()
    })
  } else {
    AC.getConfigFile()
    AC.autologin(true).catch((e) => {
      loginWindow.show()
      console.log(e)
    })
  }
})

function showTray(): void {
  const Tray = new TrayGenerator(() => {
    app.quit()
  })
  Tray.createTray()
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.dock?.hide()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
app.dock?.hide()
