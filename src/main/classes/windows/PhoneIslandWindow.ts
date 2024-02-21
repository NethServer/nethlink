import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    super('phoneislandpage', {
      width: 1,
      height: 1,
      show: false,
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
      center: false,
      fullscreen: false,
      frame: false,
      //tabbingIdentifier: 'nethconnector',
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 },
      webPreferences: {
        nodeIntegration: true
      }
    })
    setTimeout(() => {
      this.show()
    }, 100)
  }

  show(..._args: any): void {
    const display = screen.getPrimaryDisplay()
    console.log(display.bounds.x)
    this._window?.setBounds({
      height: 0,
      width: 0,
      x: 0,
      y: display.bounds.y
    })
    super.show()
  }
}
