import { createWindow } from '@/lib/windowConstructor'

export class LoginConfigWindow {
  private _window: Electron.CrossProcessExports.BrowserWindow
  constructor() {
    const size = { w: 300, h: 400 }
    this._window = createWindow('loginconfig', {
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
      center: true,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      //tabbingIdentifier: 'nethconnector',
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 }
    })
  }

  close() {
    this._window.close()
  }

  show() {
    this._window.show()
  }
}
