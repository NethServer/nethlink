import { PAGES } from '@shared/types'
import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'
import { NethLinkPageSize } from '@shared/constants'
import { log } from '@shared/utils/logger'

export class NethLinkWindow extends BaseWindow {
  static instance: NethLinkWindow
  size: { w: number; h: number } | undefined

  constructor() {
    super(PAGES.NETHLINK, {
      width: NethLinkPageSize.w,
      height: NethLinkPageSize.h,
      minWidth: NethLinkPageSize.w,
      minHeight: NethLinkPageSize.h,
      show: false,
      fullscreenable: true,
      titleBarStyle: 'default',
      autoHideMenuBar: true,
      closable: true,
      alwaysOnTop: false,
      minimizable: true,
      maximizable: true,
      movable: true,
      resizable: true,
      skipTaskbar: false,
      roundedCorners: true,
      parent: undefined,
      hasShadow: true,
      center: false,
      fullscreen: false,
      thickFrame: true,
      icon: '../../public/LogoBlueSimpleDark.svg',
      titleBarOverlay: true

    })
    this.size = NethLinkPageSize
    NethLinkWindow.instance = this

    this._window?.on('close', (e) => {
      e.preventDefault()
      this.hide()
    })
  }

  _setBounds() {
    try {
      const MARGIN = 8
      const LINUXBARHEIGHT = 32
      const MACBARHEIGHT = 25
      const WINDOWSBARHEIGHT = 40
      const screenBounds: Electron.Rectangle = screen.getPrimaryDisplay().bounds
      const { w, h } = this.size!
      let x = screenBounds.width - w - MARGIN
      let y = 0
      if (process.platform === 'win32') {
        y = screenBounds.height - h - WINDOWSBARHEIGHT - MARGIN
      }
      if (process.platform === 'linux') {
        x = screenBounds.x + screenBounds.width - w - MARGIN
        y = screenBounds.y + LINUXBARHEIGHT + MARGIN
      }
      if (process.platform === 'darwin') {
        y = screenBounds.y + MACBARHEIGHT + MARGIN
      }

      const bound: Electron.Rectangle = { x, y, width: w, height: h }
      this._window?.setBounds(bound, false)
    } catch (e) {
      log(e)
    }
  }

  show(): void {
    try {
      this._setBounds()
      super.show()
      this._window?.setVisibleOnAllWorkspaces(true)
      this._window?.focus()
      this._window?.setVisibleOnAllWorkspaces(false)
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    }
    catch (e) {
      log(e)
    }
  }

  hide(..._args: any): void {
    try {
      this._window?.hide()
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    } catch (e) {
      log(e)
    }
  }
}
