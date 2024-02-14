import { createWindow } from '@/lib/windowConstructor'
import { Tray, Menu, MenuItemConstructorOptions, MenuItem, BrowserWindow } from 'electron'
import path from 'path'

export class TrayGenerator {
  tray: Tray | undefined
  mainWindow: BrowserWindow | undefined
  size: { w: number; h: number } | undefined
  onClose: () => void
  constructor(onClose: () => void) {
    this.tray = undefined
    this.onClose = onClose
  }

  _getWindow() {
    if (!this.mainWindow) {
      this.size = { w: 400, h: 371 }
      this.mainWindow = createWindow('traypage', {
        width: this.size.w,
        height: this.size.h,
        show: false,
        fullscreenable: false,
        autoHideMenuBar: true,
        closable: false,
        kiosk: true,
        alwaysOnTop: true,
        minimizable: false,
        maximizable: false,
        movable: false,
        resizable: false,
        skipTaskbar: true,
        titleBarStyle: 'hidden',
        roundedCorners: false,
        parent: undefined,
        transparent: true
        // width: this.size.w,
        // height: this.size.h,
        // show: false,
        // fullscreenable: false,
        // autoHideMenuBar: true,
        // closable: true,
        // kiosk: false,
        // alwaysOnTop: true,
        // minimizable: false,
        // maximizable: false,
        // movable: false,
        // resizable: false,
        // skipTaskbar: true,
        // titleBarStyle: 'hidden'
        // roundedCorners: false,
        // parent: undefined,
        // transparent: false,
        // hiddenInMissionControl: true,
        // useContentSize: true,
        // hasShadow: false,
        // center: false,
        // fullscreen: false,
        // paintWhenInitiallyHidden: false,
        // acceptFirstMouse: false,
        // frame: false,
        // //tabbingIdentifier: 'nethconnector',
        // thickFrame: false,
        // trafficLightPosition: { x: 0, y: 0 }
      })
      this.mainWindow.on('close', (e) => {
        console.log(e)
        this.onClose()
      })
      //this.mainWindow.setIgnoreMouseEvents(true, {})
    }
    return this.mainWindow
  }

  rightClickMenu = () => {
    const menu: (MenuItemConstructorOptions | MenuItem)[] = [
      {
        role: 'quit',
        accelerator: 'Command+Q',
        click: this.onClose
      }
    ]
    this.tray!.popUpContextMenu(Menu.buildFromTemplate(menu))
  }

  getPosition = () => {
    console.log(this.tray)
    const trayBounds = this.tray!.getBounds()
    const x = Math.round(trayBounds.x + trayBounds.width / 2)
    const y = Math.round(trayBounds.y)
    return { x, y }
  }
  showWindow = () => {
    //const position = this.getPosition()
    //console.log(position)
    //this.mainWindow.setPosition(-1, position.y, true)
    const window = this._getWindow()
    const { x, y } = this.getPosition()
    const { w, h } = this.size!
    const bound = {
      x: x - w / 2,
      y: y + h * (process.platform === 'win32' ? -1 : 1),
      w,
      h
    }
    window.setBounds(bound, false)
    window.show()
    window.setVisibleOnAllWorkspaces(true)
    window.focus()
    window.setVisibleOnAllWorkspaces(false)
  }
  toggleWindow = () => {
    const window = this._getWindow()
    if (window.isVisible()) {
      window.blur()
      window.hide()
    } else {
      this.showWindow()
    }
  }

  createTray = () => {
    this.tray = new Tray(path.join(__dirname, '../../resources/TrayLogo.png'))
    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', this.toggleWindow)
    this.tray.on('right-click', this.rightClickMenu)
    this.tray.setToolTip('This is my application')
    this.tray.setTitle('This is my title')
    this._getWindow()
  }
}
