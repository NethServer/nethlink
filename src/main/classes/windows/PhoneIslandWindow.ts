import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'

export class PhoneIslandWindow extends BaseWindow {
  constructor() {
    super('phoneislandpage', {
      width: 800,
      height: 800,
      show: false,
      fullscreenable: false,
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
    }, 100)
    this._window?.webContents.openDevTools({ mode: 'detach' })
  }

  ignoreMouseEvents(isOver: boolean) {
    if (isOver) {
      console.log('over')
      this._window?.setIgnoreMouseEvents(false)
    } else {
      console.log('not over')
      this._window?.setIgnoreMouseEvents(true, { forward: true })
    }
  }

  show(..._args: any): void {
    // const display = screen.getPrimaryDisplay()
    // const screensSize = screen.getAllDisplays().reduce<{ x: number; y: number }>(
    //   (p, c) => {
    //     p = {
    //       x: p.x + c.size.width,
    //       y: p.y + c.size.height
    //     }
    //     console.log(c)
    //     return p
    //   },
    //   { x: 0, y: 0 }
    // )
    // console.log(display.bounds.x)
    // this._window?.setBounds({
    //   height: 0,
    //   width: 0,
    //   x: screensSize.x,
    //   y: screensSize.y
    // })
    super.show()
  }
}
