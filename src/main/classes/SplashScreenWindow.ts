import { createWindow } from '@/lib/windowConstructor'

export class SplashScreenWindow {
  constructor(onClose: () => void, timer: number = 2000) {
    const size = { w: 300, h: 400 }
    const mainWindow = createWindow('splashscreen', {
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

    setTimeout(() => {
      mainWindow.close()
      onClose()
    }, timer)
  }
}
