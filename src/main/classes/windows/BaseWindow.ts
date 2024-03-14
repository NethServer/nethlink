import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { IPC_EVENTS } from '@shared/constants'
import { BrowserWindow } from 'electron'

type Callback = (...args: any) => any
export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _callbacks: Callback[] = []

  constructor(id: string, config?: WindowOptions, params?: Record<string, string>) {
    this._window = createWindow(id, config, params)
    const onReady = (_e, completed_id) => {
      if (id === completed_id) {
        //log('on build completition of', completed_id)
        this._callbacks.forEach((c) => c())
      }
    }
    this._window.webContents.ipc.on(IPC_EVENTS.INITIALIZATION_COMPELTED, onReady)
    this._window.on('close', () => {
      this._window = createWindow(id, config, params)
    })
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
}

// async function timer(time) {
//   await new Promise((resolve) => setTimeout(resolve, time))
// }
