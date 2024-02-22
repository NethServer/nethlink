import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class NethConnectorWindow extends BaseWindow {
  static instance: NethConnectorWindow
  size: { w: number; h: number } | undefined
  constructor() {
    const size = { w: 400, h: 371 }
    super('nethconnectorpage', {
      width: size.w,
      height: size.h,
      show: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      titleBarStyle: 'hidden',
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
    NethConnectorWindow.instance = this
  }

  _setBounds() {
    const screenBounds = screen.getPrimaryDisplay().bounds
    const { w, h } = this.size!
    let x = Math.round(screenBounds.width - w - 30)
    let y = Math.round(screenBounds.height * 0.02)
    if (process.platform === 'win32') {
      const trayBounds = TrayController.instance.tray.getBounds()
      y = Math.round(screenBounds.height - h - trayBounds.height - 16)
    }
    if (process.platform === 'linux') {
      x = screenBounds.x + screenBounds.width - w - 30
      y = screenBounds.y + 55
    }
    console.log(screenBounds)
    const bound = { x, y, w, h }
    console.log(bound)
    this._window?.setBounds(bound, false)
  }

  show(): void {
    this._setBounds()
    super.show()
    this._window?.setVisibleOnAllWorkspaces(true)
    this._window?.focus()
    this._window?.setVisibleOnAllWorkspaces(false)
  }
}
