import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

export class CommandBarWindow extends BaseWindow {
  constructor() {
    super(PAGES.COMMANDBAR, {
      width: 500,
      height: 80,
      show: false,
      focusable: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      // the page draws its own rounded corners and border: the macOS mask has
      // a larger radius and would cut the border at the corners
      roundedCorners: false,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false, // Same as PhoneIsland - prevents border artifacts on Windows
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
