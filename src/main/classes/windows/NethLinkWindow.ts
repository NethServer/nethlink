import { PAGES } from '@shared/types'
import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen, BrowserViewConstructorOptions } from 'electron'
import { NethLinkPageSize } from '@shared/constants'

export class NethLinkWindow extends BaseWindow {
  static instance: NethLinkWindow
  size: { w: number; h: number } | undefined

  constructor() {
    super(PAGES.NETHLINK, {
      width: NethLinkPageSize.w,
      height: NethLinkPageSize.h,
      minWidth: NethLinkPageSize.w,
      minHeight: NethLinkPageSize.h,
      show: false,
      fullscreenable: false,
      titleBarStyle: 'default',
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: false,
      minimizable: true,
      maximizable: true,
      movable: true,
      resizable: true,
      skipTaskbar: true,
      roundedCorners: true,
      parent: undefined,
      //transparent: false,
      //hiddenInMissionControl: true,
      hasShadow: true,
      center: false,
      fullscreen: false,
      //acceptFirstMouse: false,
      //frame: false,
      thickFrame: true,
      //trafficLightPosition: { x: 0, y: 0 }
      icon: '../../public/LogoBlueSimpleDark.svg',
      titleBarOverlay: true

    })
    this.size = NethLinkPageSize
    NethLinkWindow.instance = this
  }

  _setBounds() {
    const MARGIN = 8
    const LINUXBARHEIGHT = 32
    const MACBARHEIGHT = 25
    const WINDOWSBARHEIGHT = 40
    const screenBounds: Electron.Rectangle = screen.getPrimaryDisplay().bounds
    const { w, h } = this.size!
    let x = screenBounds.width - w - MARGIN
    let y = 0
    if (process.platform === 'win32') {
      y = screenBounds.height - h - WINDOWSBARHEIGHT - MARGIN
    }
    if (process.platform === 'linux') {
      x = screenBounds.x + screenBounds.width - w - MARGIN
      y = screenBounds.y + LINUXBARHEIGHT + MARGIN
    }
    if (process.platform === 'darwin') {
      y = screenBounds.y + MACBARHEIGHT + MARGIN
    }

    const bound: Electron.Rectangle = { x, y, width: w, height: h }
    this._window?.setBounds(bound, false)
  }

  show(): void {
    this._setBounds()
    super.show()
    this._window?.setVisibleOnAllWorkspaces(true)
    this._window?.focus()
    this._window?.setVisibleOnAllWorkspaces(false)
  }

  hide(..._args: any): void {
    this._window?.minimize()
  }
}
