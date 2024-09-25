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
import { platform } from 'os'

export type TrayUpdaterProps = {
  enableShowButton?: boolean,
  isShowButtonVisible?: boolean
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
    enableShowButton,
    isShowButtonVisible
  }: TrayUpdaterProps = {
      isShowButtonVisible: true
    }) {
    const _isShowButtonVisible = isShowButtonVisible === undefined ? true : isShowButtonVisible
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        role: 'window',
        label: (LoginController.instance && LoginController.instance.window?.isOpen()) ? 'Hide Login' :
          (NethLinkController.instance && NethLinkController.instance.window?.isOpen()) ? 'Hide NethLink' :
            (store.store['account']) ? 'Show NethLink' : 'Show Login',
        commandId: 1,
        enabled: enableShowButton ?? false,
        visible: _isShowButtonVisible,
        click: (menuItem, window, event) => {
          if (enableShowButton) {
            if (LoginController.instance && LoginController.instance.window?.isOpen()) LoginController.instance.hide()
            else if (NethLinkController.instance && NethLinkController.instance.window?.isOpen()) NethLinkController.instance.hide()
            else if (store.store['account']) NethLinkController.instance.show()
            else LoginController.instance.show()
          }
        }
      },
      {
        role: process.platform === 'win32' ? 'close' : 'window',
        label: 'Quit NethLink',
        commandId: 2,
        enabled: enableShowButton ?? false,
        click: (menuItem, window, event) => {
          console.log(event)
          AppController.safeQuit()
        }
      }
    ]
    this.tray.setContextMenu(Menu.buildFromTemplate(menu))
  }

}
