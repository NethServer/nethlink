import { Menu, MenuItem, MenuItemConstructorOptions, Tray, nativeImage, nativeTheme } from 'electron'
import path from 'path'
import { LoginController } from './LoginController'
import { NethLinkController } from './NethLinkController'
import { AppController } from './AppController'
import { store } from '@/lib/mainStore'
import { isDev } from '@shared/utils/utils'
import { DevToolsController } from './DevToolsController'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'

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
        if (store.store.account) {
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
      Log.warning('error during toggling a NethLink window from the TrayIcon Button:', e)
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
      //TODO: add check if window is focused and add the focus option
      const label = store.store.account
        ? ((NethLinkController.instance && NethLinkController.instance.window?.isOpen()) ? `${t('Tray.Hide')} NethLink` : `${t('Tray.Show')} NethLink`)
        : ((LoginController.instance && LoginController.instance.window?.isOpen()) ? `${t('Tray.Hide')} Login` : `${t('Tray.Show')} Login`)
      const menu: (MenuItemConstructorOptions | MenuItem)[] = [
        {
          role: 'window',
          label: label + (store.assignedInstanceID || ''),
          commandId: 1,
          enabled: enableShowButton ?? false,
          visible: _isShowButtonVisible,
          click: (_menuItem, _window, _event) => {
            this.toggleWindow(enableShowButton ?? false)
          }
        },
        {
          role: process.platform === 'win32' ? 'close' : 'window',
          label: `${t('Tray.Quit')} NethLink`,
          commandId: 2,
          enabled: enableShowButton ?? false,
          click: (_menuItem, _window, _event) => {
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
      Log.warning('error during updating the Tray Icon menu context contents:', e)
    }

  }

}
