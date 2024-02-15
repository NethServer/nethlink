import { createWindow } from '@/lib/windowConstructor'
import { BaseWindow } from './BaseWindow'
import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, Tray, screen } from 'electron'
import { join } from 'path'
let shown = false
export class TrayWindow extends BaseWindow {
  tray: Tray
  size: { w: number; h: number } | undefined
  constructor(onTrayIconClick: () => void) {
    const size = { w: 400, h: 371 }
    super(size)
    this.size = size

    this.tray = new Tray(join(__dirname, '../../resources/TrayLogo.png'))
    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', onTrayIconClick)
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      item,
      {
        role: 'quit',
        //accelerator: 'Command+Q',
        commandId: 1
      }
    ]
    this.tray.on('right-click', () => {
      this.tray.popUpContextMenu(Menu.buildFromTemplate(menu))
    })
  }

  buildWindow(size: { w: number; h: number }): void {
    this._window = createWindow('traypage', {
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
      center: false,
      fullscreen: false,
      acceptFirstMouse: false,
      frame: false,
      //tabbingIdentifier: 'nethconnector',
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 }
    })
  }

  show(): void {
    this._setBounds()
    super.show()
    this._window?.setVisibleOnAllWorkspaces(true)
    this._window?.focus()
    this._window?.setVisibleOnAllWorkspaces(false)
  }
  _setBounds() {
    const primaryDisply = screen.getPrimaryDisplay()
    const screenBounds = primaryDisply.bounds
    console.log(screenBounds)
    //const trayBounds = this.tray.getBounds()
    const { w, h } = this.size!
    const x = Math.round(screenBounds.width - w - 8)
    const y = Math.round(screenBounds.height - 50)
    //if (y > 100 && !shown) {
    //  //shown = true
    //  this.tray.displayBalloon({
    //    title: 'NethConnector',
    //    content:
    //      "Neth Connector é stato avviato. Ricordati di impostare la visibilità dell'icona a 'sempre visibile'"
    //  })
    //}
    const bound = {
      x: x,
      y: y + h * (process.platform === 'win32' ? -1 : 1),
      w,
      h
    }
    console.log(bound)
    this._window?.setBounds(bound, false)
  }
}

const item: MenuItem = {
  role: 'services',
  checked: false,
  click: _makePriorityIcon,
  commandId: 0,
  enabled: false,
  id: '',
  label: 'Rendi sempre visibile',
  menu: new Menu(),
  registerAccelerator: false,
  sublabel: '',
  toolTip: '',
  type: 'normal',
  userAccelerator: null,
  visible: false,
  sharingItem: {}
}

function _makePriorityIcon(
  menuItem: MenuItem,
  browserWindow: BrowserWindow | undefined,
  event: KeyboardEvent
): void {
  throw new Error('Function not implemented.')
}
