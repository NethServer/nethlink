import { BaseWindow } from './BaseWindow'

export class SplashScreenWindow extends BaseWindow {
  constructor() {
    const size = { w: 400, h: 450 }
    super('splashscreenpage', {
      width: size.w,
      height: size.h,
      show: true,
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
      roundedCorners: true,
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
    //this._window?.webContents.openDevTools({ mode: 'detach' })
  }
}
