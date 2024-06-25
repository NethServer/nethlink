import { PAGES } from '@shared/types'
import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'
import { NethLinkPageSize } from '@shared/constants'

export class NethLinkWindow extends BaseWindow {
  static instance: NethLinkWindow
  size: { w: number; h: number } | undefined
  screenBounds: Electron.Rectangle
  constructor() {
    super(PAGES.NETHLINK, {
      width: NethLinkPageSize.w,
      height: NethLinkPageSize.h,
      show: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: false,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: false,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 }
    })
    this.size = NethLinkPageSize
    this.screenBounds = screen.getPrimaryDisplay().bounds
    NethLinkWindow.instance = this
  }

  _setBounds() {
    const { w, h } = this.size!
    let x = this.screenBounds.width - w - 8
    let y = 16
    if (process.platform === 'win32') {
      const trayBounds = TrayController.instance.tray.getBounds()
      y = this.screenBounds.height - h - 60
    }
    if (process.platform === 'linux') {
      x = this.screenBounds.x + this.screenBounds.width - w - 12
      y = this.screenBounds.y + 36
    }
    const bound = { x, y, w, h }
    this._window?.setBounds(bound, false)
  }

  show(): void {
    this._setBounds()
    super.show()
    this._window?.setVisibleOnAllWorkspaces(true)
    this._window?.focus()
    this._window?.setVisibleOnAllWorkspaces(false)
  }

  hideWindowFromRenderer() {
    super.hide()
  }
}
