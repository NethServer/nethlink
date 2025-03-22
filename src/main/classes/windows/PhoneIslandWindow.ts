import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

export class PhoneIslandWindow extends BaseWindow {

  public static currentSize: Partial<Electron.Rectangle> = {}
  constructor() {
    super(PAGES.PHONEISLAND, {
      width: 0,
      height: 0,
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
        nodeIntegration: true
      }
    })
  }
}
