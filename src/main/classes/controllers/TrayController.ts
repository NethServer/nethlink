import { Menu, MenuItem, MenuItemConstructorOptions, Tray, nativeImage, nativeTheme } from 'electron'
import path from 'path'
import { LoginController } from './LoginController'
import { NethLinkController } from './NethLinkController'
import { AppController } from './AppController'
import { store } from '@/lib/mainStore'
import { isDev } from '@shared/utils/utils'
import { DevToolsController } from './DevToolsController'
import { log } from '@shared/utils/logger'
import i18next, { i18n, t } from 'i18next'

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
    this.tray.on('click', () => {
      if (process.platform === 'win32') {
        this.toggleWindow(true)
      } else {
        this.tray.popUpContextMenu()
      }
    })
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

  toggleWindow(enableShowButton: boolean) {
    try {
      if (enableShowButton) {
        if (store.store['account']) {
          if (NethLinkController.instance && NethLinkController.instance.window?.isOpen())
            NethLinkController.instance.hide()
          else
            NethLinkController.instance.show()
        } else {
          if (LoginController.instance && LoginController.instance.window?.isOpen())
            LoginController.instance.hide()
          else
            LoginController.instance.show()
        }

      }
    } catch (e) {
      log(e)
    }
  }

  updateTray({
    enableShowButton,
    isShowButtonVisible
  }: TrayUpdaterProps = {
      isShowButtonVisible: true
    }) {
    try {
      const _isShowButtonVisible = isShowButtonVisible === undefined ? true : isShowButtonVisible
      const label = store.store['account']
        //? "Toggle Nethlink"
        ? ((NethLinkController.instance && NethLinkController.instance.window?.isOpen()) ? `${t('Tray.Hide')} NethLink` : `${t('Tray.Show')} NethLink`)
        //: "Toggle Login"
        : ((LoginController.instance && LoginController.instance.window?.isOpen()) ? `${t('Tray.Hide')} Login` : `${t('Tray.Show')} Login`)
      log(`UPDATE TRAY: ${label}`)
      const menu: (MenuItemConstructorOptions | MenuItem)[] = [
        {
          role: 'window',
          label: label,
          commandId: 1,
          enabled: enableShowButton ?? false,
          visible: _isShowButtonVisible,
          click: (menuItem, window, event) => {
            this.toggleWindow(enableShowButton ?? false)
          }
        },
        {
          role: process.platform === 'win32' ? 'close' : 'window',
          label: `${t('Tray.Quit')} NethLink`,
          commandId: 2,
          enabled: enableShowButton ?? false,
          click: (menuItem, window, event) => {
            console.log(event)
            AppController.safeQuit()
          }
        }
      ]

      if (isDev()) {
        menu.push({
          role: 'window',
          label: 'DevTool',
          commandId: 3,
          enabled: true,
          click: (menuItem, window, event) => {
            if (!DevToolsController.instance) {
              new DevToolsController()
            }
            DevToolsController.instance.toggle()
          }
        })
      }
      this.tray.setContextMenu(Menu.buildFromTemplate(menu))
    } catch (e) {
      log(e)
    }

  }

}
