import {
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  Tray,
  app,
  nativeImage,
  nativeTheme,
  shell,
} from 'electron'
import path from 'path'
import { LoginController } from './LoginController'
import { NethLinkController } from './NethLinkController'
import { AppController } from './AppController'
import { store } from '@/lib/mainStore'
import { isDev } from '@shared/utils/utils'
import { DevToolsController } from './DevToolsController'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'
import { AccountController } from './AccountController'
import { AvailableThemes } from '@shared/types'

export type TrayUpdaterProps = {
  enableShowButton?: boolean
  isShowButtonVisible?: boolean
}
export class TrayController {
  tray: Tray
  static instance: TrayController
  constructor() {
    TrayController.instance = this
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
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
      pathImage =
        theme === 'light'
          ? '../../public/TrayToolbarIconBlack.png'
          : '../../public/TrayToolbarIconWhite.png'
    }
    const image = nativeImage
      .createFromPath(path.join(__dirname, pathImage))
      .resize({ height: 18, width: 18 })
    image.setTemplateImage(true)
    return image
  }

  // a 16px icon of the menu, from public/tray (the @2x file is picked up on
  // HiDPI screens): a template image on macOS, which follows the menu bar,
  // the color of the system theme elsewhere
  getMenuIcon(
    name:
      | 'show'
      | 'hide'
      | 'quit'
      | 'devtools'
      | 'theme'
      | 'download'
      | 'update'
      | 'check'
      | 'blank',
  ) {
    const variant =
      process.platform === 'darwin'
        ? 'Template'
        : nativeTheme.shouldUseDarkColors
          ? 'Dark'
          : 'Light'
    const image = nativeImage.createFromPath(
      path.join(__dirname, `../../public/tray/${name}${variant}.png`),
    )
    if (process.platform === 'darwin') image.setTemplateImage(true)
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
          if (
            NethLinkController.instance &&
            NethLinkController.instance.window?.isOpen()
          )
            NethLinkController.instance.hide()
          else NethLinkController.instance.show()
        } else {
          if (
            LoginController.instance &&
            LoginController.instance.window?.isOpen()
          )
            LoginController.instance.hide()
          else LoginController.instance.show()
        }
        // the label of the item at once: the window events update it later
        this.refresh()
      }
    } catch (e) {
      Log.warning(
        'error during toggling a NethLink window from the TrayIcon Button:',
        e,
      )
    }
  }

  // the last options of the menu, to rebuild it when the theme or the update change
  private lastProps: TrayUpdaterProps = { isShowButtonVisible: true }
  // the newer release found by the update check, if any
  private update?: { version: string; url: string }
  // set by the main process: checks for updates now, from the menu
  checkForUpdates?: () => void

  // rebuilds the menu with its last options, such as after a theme change
  refresh() {
    this.updateTray(this.lastProps)
  }

  setUpdate(update?: { version: string; url: string }) {
    this.update = update
    this.updateTray(this.lastProps)
  }

  private changeTheme(theme: AvailableThemes) {
    AccountController.instance?.updateTheme(theme)
    this.updateTray(this.lastProps)
  }

  updateTray(
    { enableShowButton, isShowButtonVisible }: TrayUpdaterProps = {
      isShowButtonVisible: true,
    },
  ) {
    try {
      this.lastProps = { enableShowButton, isShowButtonVisible }
      const _isShowButtonVisible =
        isShowButtonVisible === undefined ? true : isShowButtonVisible
      const isWindowOpen = store.store.account
        ? !!(
            NethLinkController.instance &&
            NethLinkController.instance.window?.isOpen()
          )
        : !!(
            LoginController.instance &&
            LoginController.instance.window?.isOpen()
          )
      const label = `${t(isWindowOpen ? 'Tray.Hide' : 'Tray.Show')} ${
        store.store.account ? 'NethLink' : 'Login'
      }`
      const currentTheme: AvailableThemes =
        (store.store.account?.theme as AvailableThemes) || 'system'
      // a check icon instead of a radio item: macOS would add a column for the
      // check mark and push every icon of the menu to the right
      const themeItem = (theme: AvailableThemes, labelKey: string) =>
        ({
          label: t(labelKey) as string,
          icon: this.getMenuIcon(currentTheme === theme ? 'check' : 'blank'),
          click: () => this.changeTheme(theme),
        }) as MenuItemConstructorOptions

      const menu: (MenuItemConstructorOptions | MenuItem)[] = [
        // the name and the version, as a title
        { label: `NethLink ${app.getVersion()}`, enabled: false },
        { type: 'separator' },
        {
          role: 'window',
          label: label + (store.assignedInstanceID || ''),
          icon: this.getMenuIcon(isWindowOpen ? 'hide' : 'show'),
          commandId: 1,
          enabled: enableShowButton ?? false,
          visible: _isShowButtonVisible,
          click: (_menuItem, _window, _event) => {
            this.toggleWindow(enableShowButton ?? false)
          },
        },
      ]

      // the theme of the account, once signed in
      if (store.store.account) {
        menu.push(
          { type: 'separator' },
          {
            label: t('Tray.Theme') as string,
            icon: this.getMenuIcon('theme'),
            enabled: false,
          },
          themeItem('system', 'Tray.System'),
          themeItem('light', 'Tray.Light'),
          themeItem('dark', 'Tray.Dark'),
        )
      }

      menu.push(
        { type: 'separator' },
        this.update
          ? {
              label: t('Tray.Download version', {
                version: this.update.version,
              }) as string,
              icon: this.getMenuIcon('download'),
              click: () => shell.openExternal(this.update!.url),
            }
          : {
              label: t('Tray.Check for updates') as string,
              icon: this.getMenuIcon('update'),
              enabled: !!this.checkForUpdates,
              click: () => this.checkForUpdates?.(),
            },
        { type: 'separator' },
        {
          role: process.platform === 'win32' ? 'close' : 'window',
          label: `${t('Tray.Quit')} NethLink`,
          icon: this.getMenuIcon('quit'),
          commandId: 2,
          enabled: enableShowButton ?? false,
          click: (_menuItem, _window, _event) => {
            AppController.safeQuit()
          },
        },
      )

      if (isDev()) {
        menu.push({
          role: 'window',
          label: 'DevTool',
          icon: this.getMenuIcon('devtools'),
          commandId: 3,
          enabled: true,
          click: (menuItem, window, event) => {
            if (!DevToolsController.instance) {
              new DevToolsController()
            }
            DevToolsController.instance.toggle()
          },
        })
      }
      this.tray.setContextMenu(Menu.buildFromTemplate(menu))
    } catch (e) {
      Log.warning(
        'error during updating the Tray Icon menu context contents:',
        e,
      )
    }
  }
}
