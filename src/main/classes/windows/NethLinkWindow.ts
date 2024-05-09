import { PAGES } from '@shared/types'
import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class NethLinkWindow extends BaseWindow {
  static instance: NethLinkWindow
  size: { w: number; h: number } | undefined
  constructor() {
    const size = { w: 400, h: 380 }
    super(PAGES.NETHLINK, {
      width: size.w,
      height: size.h,
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
      //tabbingIdentifier: 'nethconnector',
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 }
    })
    this.size = size
    NethLinkWindow.instance = this
    //this._window?.webContents.openDevTools({ mode: 'detach' })
  }

  _setBounds() {
    const screenBounds = screen.getPrimaryDisplay().bounds
    const { w, h } = this.size!
    let x = screenBounds.width - w - 20
    let y = 15
    if (process.platform === 'win32') {
      const trayBounds = TrayController.instance.tray.getBounds()
      y = screenBounds.height - h - 60
    }
    if (process.platform === 'linux') {
      x = screenBounds.x + screenBounds.width - w - 18
      y = screenBounds.y + 35
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
