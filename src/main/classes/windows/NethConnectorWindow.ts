import { createWindow } from '@/lib/windowConstructor'
import { BaseWindow } from './BaseWindow'
import { BrowserWindow, Menu, MenuItem, screen } from 'electron'

export class NethConnectorWindow extends BaseWindow {
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
  }

  _setBounds() {
    const screenBounds = screen.getPrimaryDisplay().size
    console.log(screenBounds)
    const { w, h } = this.size!
    const x = Math.round(screenBounds.width - w - screenBounds.width * 0.01)
    const y =
      process.platform === 'win32'
        ? Math.round(screenBounds.height - h - screenBounds.height * 0.02)
        : Math.round(screenBounds.height * 0.2)
    const bound = {
      x: screen.getCursorScreenPoint().x - 210,
      y: 0,
      w,
      h
    }
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
