import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { is } from '@electron-toolkit/utils'
import { IPC_EVENTS } from '@shared/constants'
import { AvailableThemes, PAGES } from '@shared/types'
import { log } from '@shared/utils/logger'
import { debouncer } from '@shared/utils/utils'
import { BrowserWindow, nativeTheme } from 'electron'
import { DevToolsController, LoginController, PhoneIslandController } from '../controllers'
import { SplashScreenController } from '../controllers/SplashScreenController'
import { NethLinkController } from '../controllers/NethLinkController'

type Callback = (...args: any) => any
export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _callbacks: Callback[] = []
  protected _id: string

  constructor(id: string, config?: WindowOptions, params?: Record<string, string>) {
    this._id = id
    params = {
      ...params,
    }
    const window = createWindow(id, config, params)
    window.setTitle(id)
    const instance = this
    this._window = window
    const onReady = (_e) => {
      this._callbacks.forEach((c) => c())
      //once called I remove them
      this._callbacks = []

    }

    function onOpenDevTools(e, page) {
      instance.openDevTool(page)
    }

    window.once('ready-to-show', onReady)
    window.on('hide', () => {
      //window.webContents.closeDevTools()
    })
    //this._window.webContents.ipc.on(IPC_EVENTS.INITIALIZATION_COMPELTED, onReady)
    this._window.webContents.ipc.on(IPC_EVENTS.OPEN_DEV_TOOLS, onOpenDevTools)
  }

  openDevTool(page) {
    const windows = BrowserWindow.getAllWindows()
    const target = windows.find((w) => {
      return w.title === page
    })
    if (target) {
      target.webContents.isDevToolsOpened()
        ? target.webContents.closeDevTools()
        : target.webContents.openDevTools({
          title: target.title,
          mode: 'detach'
        })
    }
  }

  getWindow() {
    return this._window
  }

  emit(event: IPC_EVENTS | string, ...args: any[]) {
    try {
      this._window?.webContents.send(event, ...args)
    } catch (e) {
      log('ERROR on window.emit', e, { event, args })
      throw (e)
    }
  }

  hide(..._args: any) {
    this._window?.hide()
  }

  show(..._args: any) {
    this._window!.show()
  }

  isOpen(..._args: any) {
    try {

      return this._window?.isVisible()
    } catch (e) {
      return false
    }
  }

  addOnBuildListener(callback: () => void) {
    this._callbacks.push(callback)
  }

  async addListener(event: string, callback: (...args: any[]) => void) {
    this._window!.webContents.ipc.on(event, callback)
  }

  quit() {
    try {
      this._window?.hide()
      this._window?.destroy()
    } catch (e) {
      log(e)
    }
  }
}

