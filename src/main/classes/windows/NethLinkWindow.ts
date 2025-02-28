import { PAGES } from '@shared/types'
import { TrayController } from '../controllers/TrayController'
import { BaseWindow } from './BaseWindow'
import { screen } from 'electron'
import { NethLinkPageSize } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { debouncer, delay } from '@shared/utils/utils'
import { AccountController } from '../controllers'

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
      const nethlinkBounds: Electron.Rectangle = { x, y, width: w, height: h }
      this._window?.setBounds(nethlinkBounds, false)
    } catch (e) {
      Log.warning('during update bounds of the NethLinkWindow:', e)
    }
  }

  show(): void {
    try {
      const accountBounds = AccountController.instance.getAccountNethLinkBounds()
      if (accountBounds) {
        const isAccountBoundsOnDisplay = screen.getAllDisplays().reduce((result, display) => {
          const area = display.workArea
          return (
            result ||
            (accountBounds.x >= area.x &&
              accountBounds.y >= area.y &&
              (accountBounds.x + accountBounds.width) < (area.x + area.width) &&
              (accountBounds.y + accountBounds.height) < (area.y + area.height))
          )
        }, false)
        if (isAccountBoundsOnDisplay) {
          this._window?.setBounds(accountBounds, false)
        } else {
          this._setBounds()
        }
      } else {
        this._setBounds()
      }
      super.show()
      this._window?.setVisibleOnAllWorkspaces(true)
      this._window?.focus()
      this._window?.setVisibleOnAllWorkspaces(false)
    }
    catch (e: any) {
      if (e.message === 'Object has been destroyed') {
        this.buildWindow()
        return this.show()
      } else {
        Log.warning('during showing the NethLinkWindow:', e)
      }
    }
  }

  hide(..._args: any): void {
    try {
      this.saveBounds()
      this._window?.hide()
    } catch (e) {
      Log.warning('during hiding the NethLinkWindow:', e)
    }
  }

  saveBounds(bounds: Electron.Rectangle | undefined = undefined) {
    const nethlinkBounds = bounds || this._window?.getBounds()
    AccountController.instance.setAccountNethLinkBounds(nethlinkBounds)
  }

  buildWindow(): void {
    super.buildWindow()
    this._window?.on('hide', this.toggleVisibility)
    this._window?.on('moved', () => {
      debouncer('onMoveNethLinkWindow', () => this.saveBounds(), 1000)
    })
    this._window?.on('show', this.toggleVisibility)
    this._window?.on('closed', this.toggleVisibility)
    this._window?.on('close', (e) => {
      e.preventDefault()
      this.hide()
    })
  }

  async toggleVisibility() {
    debouncer('nethlinkToggleVisibility', async () => {
      await delay(250)
      TrayController.instance.updateTray({
        enableShowButton: true
      })
    })
  }
}
