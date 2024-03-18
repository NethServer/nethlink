import { BaseWindow } from './BaseWindow'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    super('phoneislandpage', {
      width: 500,
      height: 500,
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
      transparent: false,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      enableLargerThanScreen: false,
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
    //this._window?.webContents.openDevTools({ mode: 'detach' })
  }
}
