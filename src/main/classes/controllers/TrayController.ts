import { Menu, MenuItem, MenuItemConstructorOptions, Tray, app, nativeImage, nativeTheme } from 'electron'
import path, { join } from 'path'
import { AccountController } from './AccountController'
import { LoginController } from './LoginController'
import { NethLinkController } from './NethLinkController'
import { SplashScreenController } from './SplashScreenController'
import { PhoneIslandController } from './PhoneIslandController'
import { AppController } from './AppController'
import { log } from '@shared/utils/logger'
import { store } from '@/lib/mainStore'

export type TrayUpdaterProps = {
  enableShowButton?: boolean
}
export class TrayController {
  tray: Tray
  static instance: TrayController
  constructor() {
    TrayController.instance = this
    const theme = nativeTheme.shouldUseDarkColors
      ? 'dark'
      : 'light'
    const image = this.getImage(theme)
    this.tray = new Tray(image)
    this.updateTray()
  }

  getImage(theme: 'light' | 'dark') {
    let pathImage = '../../public/TrayToolbarIconWhite.png'
    if (process.platform === 'win32') {
      pathImage = theme === 'light' ? '../../public/TrayToolbarIconBlack.png' : '../../public/TrayToolbarIconWhite.png'
    }
    const image = nativeImage.createFromPath(
      path.join(__dirname, pathImage)
    ).resize({ height: 18, width: 18 })
    image.setTemplateImage(true);
    return image
  }


  changeIconByTheme(theme: 'light' | 'dark') {
    const image = this.getImage(theme)
    this.tray.setImage(image)
  }

  updateTray({
    enableShowButton
  }: TrayUpdaterProps = {}) {
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        role: 'window',
        label: "NethLink",
        commandId: 1,
        enabled: enableShowButton ?? false,
        click: () => {
          if (enableShowButton) {
            if (LoginController.instance && LoginController.instance.window?.isOpen()) LoginController.instance.hide()
            else if (NethLinkController.instance && NethLinkController.instance.window?.isOpen()) NethLinkController.instance.hide()
            else if (store.store['account']) NethLinkController.instance.show()
            else LoginController.instance.show()
          }
        }
      },
      {
        role: 'close',
        commandId: 2,
        click: () => {
          AppController.safeQuit()
        }
      }
    ]
    this.tray.on('right-click', () => {
      this.tray.popUpContextMenu(Menu.buildFromTemplate(menu))
    })
    this.tray.on('click', () => {
      this.tray.popUpContextMenu(Menu.buildFromTemplate(menu))
    })
  }

}
