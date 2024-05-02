import { Menu, MenuItem, MenuItemConstructorOptions, Tray, app } from 'electron'
import { join } from 'path'
import { AccountController } from './AccountController'
import { LoginController } from './LoginController'
import { NethLinkController } from './NethLinkController'
import { SplashScreenController } from './SplashScreenController'
import { PhoneIslandController } from './PhoneIslandController'

export class TrayController {
  tray: Tray
  enableClick = false

  static instance: TrayController
  constructor() {
    TrayController.instance = this

    this.tray = new Tray(join(__dirname, '../../public/TrayToolbarIcon.png'))
    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', () => {
      if (this.enableClick) {
        if (LoginController.instance.window?.isOpen()) LoginController.instance.hide()
        else if (NethLinkController.instance.window.isOpen()) NethLinkController.instance.hide()
        else if (AccountController.instance.getLoggedAccount()) NethLinkController.instance.show()
        else LoginController.instance.show()
      }
    })
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        role: 'quit',
        //accelerator: 'Command+Q',
        commandId: 1,
        click: () => {
          //TODO: trovare un modo per killare l'app
          SplashScreenController.instance.window.quit()
          NethLinkController.instance.window.quit()
          PhoneIslandController.instance.window.quit()
          LoginController.instance.window.quit()
          TrayController.instance.tray.destroy()
          app.quit()
        }
      }
    ]
    this.tray.on('right-click', () => {
      this.tray.popUpContextMenu(Menu.buildFromTemplate(menu))
    })
  }
}
