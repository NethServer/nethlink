import { createWindow } from '@/lib/windowConstructor'
import { BaseWindow } from './BaseWindow'

export class PhoneIslandWindow extends BaseWindow {
  buildWindow() {
    const size = { w: 300, h: 400 }
    this._window = createWindow('phoneislandpage', {
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
}
