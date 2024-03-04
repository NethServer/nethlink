import { s } from 'vite/dist/node/types.d-jgA8ss1A'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    const size = screen.getAllDisplays().reduce(
      (p, c) => {
        return {
          x: p.x + c.size.width,
          y: p.y + c.size.height
        }
      },
      { x: 0, y: 0 }
    )
    super('phoneislandpage', {
      width: size.x,
      height: size.y,
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
      //this.ignoreMouseEvents(false)
    }, 100)
    this._window?.webContents.openDevTools({ mode: 'detach' })
  }

  ignoreMouseEvents(ignoreEvents: boolean) {
    console.log(ignoreEvents)
    this._window?.setIgnoreMouseEvents(ignoreEvents, {
      forward: true
    })
  }
}
