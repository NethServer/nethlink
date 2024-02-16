import { WindowOptions, createWindow } from '@/lib/windowConstructor'
import { IPC_EVENTS } from '@shared/constants'
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'

type Callback = (...args: any) => any
export class BaseWindow {
  protected _window: BrowserWindow | undefined
  protected _callbacks: Callback[] = []

  constructor(id: string, config?: WindowOptions, params?: Record<string, string>) {
    this._window = createWindow(id, config, params)
    this._window.webContents.ipc.on(
      IPC_EVENTS.INITIALIZATION_COMPELTED,
      async (e, completed_id) => {
        if (id === completed_id) {
          console.log(completed_id)
          this._callbacks.forEach((c) => c())
        }
      }
    )
  }

  emit(event: IPC_EVENTS, ...args: any[]) {
    console.log(event, args)
    this._window?.webContents.send(event, ...args)
  }

  hide(...args: any) {
    this._window?.hide()
  }

  show(...args: any) {
    this._window!.show()
  }

  close(...args: any) {
    this._window?.close()
    this._window = undefined
  }

  isOpen(...args: any) {
    return this._window?.isVisible()
  }

  async addOnBuildListener(callback: () => void) {
    this._callbacks.push(callback)
  }

  async addListener(event: string, callback: (...args: any[]) => void) {
    this._window!.webContents.ipc.on(event, callback)
  }
}

async function timer(time) {
  await new Promise((resolve) => setTimeout(resolve, time))
}
