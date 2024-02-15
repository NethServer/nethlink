import { createWindow } from '@/lib/windowConstructor'
import { BaseWindow } from './BaseWindow'
import { PhoneIslandConfig } from '@shared/types'
import { screen } from 'electron'

export class PhoneIslandWindow extends BaseWindow {
  buildWindow(dataConfig: PhoneIslandConfig) {
    const displays = screen.getAllDisplays()
    const size = displays.reduce(
      (p, c) => {
        p.w += c.size.width
        p.h += c.size.height
        return p
      },
      { w: 0, h: 0 }
    )
    this._window = createWindow(
      'phoneislandpage',
      {
        width: 600,
        height: 600,
        show: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        closable: false,
        alwaysOnTop: true,
        minimizable: false,
        maximizable: false,
        movable: true,
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
        frame: true,
        //tabbingIdentifier: 'nethconnector',
        thickFrame: true,
        trafficLightPosition: { x: 0, y: 0 },
        title: 'ciao'
      },
      dataConfig
    )
    //this._window.setIgnoreMouseEvents(true)
    this._window.show()
  }

  getWindow() {
    return this._window
  }
  show(...args: any): void {
    const display = screen.getPrimaryDisplay()
    display.bounds.x
    this._window
  }
}
