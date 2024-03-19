import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { is } from '@electron-toolkit/utils'
import { IPC_EVENTS } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { BrowserWindow } from 'electron'

type Callback = (...args: any) => any
export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _callbacks: Callback[] = []

  constructor(id: string, config?: WindowOptions, params?: Record<string, string>) {
    params = {
      ...params,
      isDev: `${Boolean(is.dev && process.env['ELECTRON_RENDERER_URL'])}`
    }
    this._window = createWindow(id, config, params)
    const onReady = (_e, completed_id) => {
      if (id === completed_id) {
        log('on build completition of', completed_id)
        this._callbacks.forEach((c) => c())
      }
    }

    const onOpenDevTools = (_e, page_id) => {
      log('on build completition of', id, page_id, this._window?.webContents.isDevToolsOpened())
      this._window?.webContents.isDevToolsOpened()
        ? this._window?.webContents.closeDevTools()
        : this._window?.webContents.openDevTools({
            mode: 'detach'
          })
    }

    this._window.webContents.ipc.on(IPC_EVENTS.INITIALIZATION_COMPELTED, onReady)
    this._window.webContents.ipc.on(IPC_EVENTS.OPEN_DEV_TOOLS, onOpenDevTools)
    // this._window.on('close', () => {
    //   this._window = createWindow(id, config, params)
    // })
  }

  getWindow() {
    return this._window
  }

  emit(event: IPC_EVENTS | string, ...args: any[]) {
    this._window?.webContents.send(event, ...args)
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

// async function timer(time) {
//   await new Promise((resolve) => setTimeout(resolve, time))
// }
