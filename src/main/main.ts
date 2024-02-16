import { Menu, MenuItem, MenuItemConstructorOptions, Tray, app } from 'electron'
import {
  LoginWindow,
  NethConnectorWindow,
  PhoneIslandWindow,
  SettingsWindow,
  SplashScreenWindow
} from '@/classes/windows'
import { registerIpcEvents } from '@/lib/ipcEvents'
import { AccountController } from './classes/controllers'
import path from 'path'

new AccountController(app)
const accountController = AccountController.instance
registerIpcEvents()

app.whenReady().then(() => {
  const tray = new Tray(path.join(__dirname, '../../resources/TrayLogo.png'))
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', toggleWindow)
  tray.on('right-click', () => trayRightMenu(tray))

  const loginWindow = new LoginWindow()
  const phoneIslandWindow = new PhoneIslandWindow()
  const splashScreenWindow = new SplashScreenWindow()
  const nethConnectorWindow = new NethConnectorWindow(tray)
  nethConnectorWindow.setBounds()
  const settingsWindow = new SettingsWindow(/** trayWindow */)

  function toggleWindow() {
    // La tray deve chiudere solamente o la loginpage o la traypage, quindi il controllo viene eseguito solo su di loro
    // if (trayWindow.isOpen() || loginWindow.isOpen()) {
    //   trayWindow.hide()
    //   loginWindow.close()
    // } else {
    //   if (!accountController.hasConfigsFolder()) {
    //     splashScreenWindow.show()
    //     accountController.createConfigFile()
    //     setTimeout(() => {
    //       splashScreenWindow.close()
    //       loginWindow.show()
    //     }, 2500)
    //   } else {
    //     accountController.getConfigFile()
    //     accountController
    //       .autologin(true)
    //       .then(() => trayWindow.show())
    //       .catch(() => {
    //         loginWindow.show()
    //       })
    //   }
    // }
    nethConnectorWindow.show()
  }

  toggleWindow()

  accountController.onAccountChange(() => {
    try {
      loginWindow.close()
    } catch (e) {
      console.log(e)
    }
    nethConnectorWindow.show()
  })
})

function trayRightMenu(tray: Tray) {
  const menu: (MenuItemConstructorOptions | MenuItem)[] = [
    {
      role: 'quit',
      accelerator: 'Command+Q'
    }
  ]
  tray.popUpContextMenu(Menu.buildFromTemplate(menu))
}

app.on('window-all-closed', () => {
  app.dock?.hide()
})

app.dock?.hide()
