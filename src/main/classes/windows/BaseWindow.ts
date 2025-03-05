import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
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
      Log.error('on window.emit', e, { event, args })
      throw (e)
    }
  }

  hide(..._args: any) {
    try {
      this._window?.hide()
    } catch (e) {
      Log.warning('during hiding window:', e)
    }
  }

  show(..._args: any) {
    try {
      this._window?.show()
    } catch (e: any) {
      Log.warning('during showing window:', e)
    }
  }

  isOpen(..._args: any) {
    try {
      const visible = this._window?.isVisible()
      const minimized = this._window?.isMinimized()
      const destroyed = this._window?.isDestroyed()
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
        this._window?.destroy()
        await delay(50)
      } else {
        this._window?.hide()
        await delay(50)
      }
    } catch (e) {
      Log.warning('during quitting window:', e)
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
    isDev() && window.webContents.ipc.on(IPC_EVENTS.OPEN_DEV_TOOLS, onOpenDevTools)
    !isDev() && window.removeMenu()
    this._window = window
  }
}

