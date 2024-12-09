import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'
import { TrayController } from '../controllers'
import { Log } from '@shared/utils/logger'

export class SplashScreenWindow extends BaseWindow {
  constructor() {
    const size = { w: 400, h: 450 }
    super(PAGES.SPLASHSCREEN, {
      width: size.w,
      height: size.h,
      show: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: false,
      roundedCorners: true,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 }
    })
  }

  show(): void {
    try {
      super.show()
      TrayController.instance.updateTray({
        enableShowButton: true,
        isShowButtonVisible: false
      })
    }
    catch (e) {
      Log.warning('during showing the SplashScreenWindow:', e)
    }
  }

  hide(..._args: any): void {
    try {
      this._window?.hide()
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    } catch (e) {
      Log.warning('during hiding the SplashScreenWindow:', e)
    }
  }
}
