import { BaseWindow } from './BaseWindow'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    super('phoneislandpage', {
      width: 800,
      height: 800,
      show: false,
      fullscreenable: true,
      autoHideMenuBar: true,
      closable: false,
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
      center: true,
      fullscreen: false,
      enableLargerThanScreen: true,
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
      //this._window?.setIgnoreMouseEvents(true, { forward: true })
    }, 100)
    this._window?.webContents.openDevTools({ mode: 'detach' })
  }

  ignoreMouseEvents(isOver: boolean) {
    if (isOver) {
      console.log('over')
      this._window?.setIgnoreMouseEvents(false)
    } else {
      console.log('not over')
      this._window?.setIgnoreMouseEvents(true, { forward: true })
    }
  }
}
