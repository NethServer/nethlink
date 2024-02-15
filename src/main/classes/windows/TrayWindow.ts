import { createWindow } from '@/lib/windowConstructor'
import { BaseWindow } from './BaseWindow'
import { Tray } from 'electron'

export class TrayWindow extends BaseWindow {
  tray: Tray
  size: { w: number; h: number } | undefined
  constructor(tray: Tray) {
    super()
    this.tray = tray
  }

  buildWindow(): void {
    this.size = { w: 400, h: 371 }
    this._window = createWindow('traypage', {
      width: this.size.w,
      height: this.size.h,
      alwaysOnTop: true
      // show: false,
      // fullscreenable: false,
      // autoHideMenuBar: true,
      // closable: true,
      // alwaysOnTop: true,
      // minimizable: false,
      // maximizable: false,
      // movable: false,
      // resizable: false,
      // skipTaskbar: true,
      // titleBarStyle: 'hidden',
      // roundedCorners: false,
      // parent: undefined,
      // transparent: true,
      // hiddenInMissionControl: true,
      // hasShadow: false,
      // center: true,
      // fullscreen: false,
      // acceptFirstMouse: false,
      // frame: false,
      // //tabbingIdentifier: 'nethconnector',
      // thickFrame: false,
      // trafficLightPosition: { x: 0, y: 0 }
    })
  }

  setBounds() {
    const trayBounds = this.tray.getBounds()
    const x = Math.round(trayBounds.x + trayBounds.width / 2)
    const y = Math.round(trayBounds.y)
    const { w, h } = this.size!
    const bound = {
      x: x - w / 2,
      y: y + h * (process.platform === 'win32' ? -1 : 1),
      w,
      h
    }
    this._window?.setBounds(bound, false)
    this._window?.setVisibleOnAllWorkspaces(true)
    this._window?.focus()
    this._window?.setVisibleOnAllWorkspaces(false)
  }
}
