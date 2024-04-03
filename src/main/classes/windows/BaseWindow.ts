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
    this._window = createWindow(id, config, params)
    const onReady = (_e, completed_id) => {
      if (id === completed_id) {
        //log('on build completition of', completed_id)
        this._callbacks.forEach((c) => c())
      }
    }

    const onOpenDevTools = (_e, page_id) => {
      //log('on build completition of', id, page_id, this._window?.webContents.isDevToolsOpened())
      log('open dev tool of', page_id === PAGES.SPLASHSCREEN)
      let targetWindow: BaseWindow | undefined
      switch (page_id) {
        case PAGES.DEVTOOLS: targetWindow = DevToolsController.instance.window; break;
        case PAGES.LOGIN: targetWindow = LoginController.instance.window; break;
        case PAGES.SPLASHSCREEN: targetWindow = SplashScreenController.instance.window; break;
        case PAGES.NETHLINK: targetWindow = NethLinkController.instance.window; break;
        case PAGES.PHONEISLAND: targetWindow = PhoneIslandController.instance.window; break;
      }
      if (targetWindow) {
        targetWindow!.openDevTool()
      }
    }
    this._window.webContents.ipc.on(IPC_EVENTS.INITIALIZATION_COMPELTED, onReady)
    this._window.webContents.ipc.on(IPC_EVENTS.OPEN_DEV_TOOLS, onOpenDevTools)
  }
  openDevTool() {
    this._window!.webContents.isDevToolsOpened()
      ? this._window!.webContents.closeDevTools()
      : this._window!.webContents.openDevTools({
        mode: 'detach'
      })
  }

  getWindow() {
    return this._window
  }

  emit(event: IPC_EVENTS | string, ...args: any[]) {
    try {
      this._window?.webContents.send(event, ...args)
    } catch (e) {
      log(e, { event, args })
    }
  }

  hide(..._args: any) {
    this._window?.hide()
  }

  show(..._args: any) {
    this._window!.show()
  }

  isOpen(..._args: any) {
    return this._window?.isVisible()
  }

  addOnBuildListener(callback: () => void) {
    this._callbacks.push(callback)
  }

  async addListener(event: string, callback: (...args: any[]) => void) {
    this._window!.webContents.ipc.on(event, callback)
  }

  quit() {
    this._window?.close()
  }
}

