import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

// Transparent, always on top: the chat stays in view with NethLink closed.
export class ChatIslandWindow extends BaseWindow {
  constructor() {
    super(PAGES.CHATISLAND, {
      width: 440,
      height: 600,
      show: false,
      focusable: true,
      acceptFirstMouse: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: false,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      fullscreen: false,
      enableLargerThanScreen: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 },
      webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false,
      },
    })

    this.addOnBuildListener(() => {
      this.getWindow()?.setAlwaysOnTop(true, 'screen-saver')
    })
  }
}
