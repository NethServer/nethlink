import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { IPC_EVENTS } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { BrowserWindow } from 'electron'

type Callback = (...args: any) => any
export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _callbacks: Callback[] = []
  protected _id: string
  private _params: Record<string, string>
  private _config: WindowOptions

  constructor(id: string, config?: WindowOptions, params?: Record<string, string>) {
    this._id = id
    this._params = Object.assign({}, params)
    this._config = Object.assign({}, config)
    this.buildWindow()
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
    try {
      this._window?.hide()
    } catch (e) {
      log(e)
    }
  }

  show(..._args: any) {
    try {
      this._window?.show()
    } catch (e: any) {
      log(e)
    }
  }

  isOpen(..._args: any) {
    try {
      const visible = this._window?.isVisible()
      const minimized = this._window?.isMinimized()
      const destroyed = this._window?.isDestroyed()
      log({ visible, minimized, destroyed })
      return visible && !minimized && !destroyed
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

  async quit(forceClose: boolean) {
    try {
      if (forceClose) {
        log(`destroy ${this._id}`)
        this._window?.destroy()
        await delay(50)
      } else {
        log(`hide ${this._id}`)
        this._window?.hide()
        await delay(50)
      }
    } catch (e) {
      log(e)
    }
  }

  buildWindow() {
    const window = createWindow(this._id, this._config, this._params)
    window.setTitle(this._id)
    const instance = this

    const onReady = (_e) => {
      this._callbacks.forEach((c) => c())
      //once called I remove them
      this._callbacks = []
    }

    function onOpenDevTools(e, page) {
      instance.openDevTool(page)
    }

    window.once('ready-to-show', onReady)
    //this._window.webContents.ipc.on(IPC_EVENTS.INITIALIZATION_COMPELTED, onReady)
    isDev() && window.webContents.ipc.on(IPC_EVENTS.OPEN_DEV_TOOLS, onOpenDevTools)

    this._window = window
  }
}

