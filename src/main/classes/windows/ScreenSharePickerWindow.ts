import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

export const SCREEN_SHARE_PICKER_SIZE = { width: 720, height: 520 }

export class ScreenSharePickerWindow extends BaseWindow {
  constructor() {
    super(PAGES.SCREENSHAREPICKER, {
      width: SCREEN_SHARE_PICKER_SIZE.width,
      height: SCREEN_SHARE_PICKER_SIZE.height,
      show: false,
      focusable: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: true,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: true,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      enableLargerThanScreen: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 },
      webPreferences: {
        nodeIntegration: true,
      },
    })

    this.addOnBuildListener(() => {
      const window = this.getWindow()
      if (window) {
        window.setAlwaysOnTop(true, 'screen-saver')
      }
    })
  }
}
