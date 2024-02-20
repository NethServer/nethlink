import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    super('phoneislandpage', {
      width: 0,
      height: 0,
      show: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: true,
      titleBarStyle: 'hidden',
      roundedCorners: false,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      frame: false,
      //tabbingIdentifier: 'nethconnector',
      thickFrame: true,
      trafficLightPosition: { x: 0, y: 0 },
      webPreferences: {
        nodeIntegration: true
      }
    })
  }

  show(..._args: any): void {
    const display = screen.getPrimaryDisplay()
    display.bounds.x
    this._window
  }
}
