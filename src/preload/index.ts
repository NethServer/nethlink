import {
  NotificationConstructorOptions,
  contextBridge,
  ipcRenderer,
} from 'electron'
import os from 'os'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS } from '@shared/constants'
import { Size } from '@shared/types'
import { preloadBindings } from 'i18next-electron-fs-backend'

export interface IElectronAPI {
  env: NodeJS.ProcessEnv
  appVersion: string
  platform: string
  osRelease: string
  arch: string

  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  // TRANSLATIONS
  i18nextElectronBackend: any

  // SYNC EMITTERS - expect response
  getLocale(): Promise<string>

  // EMITTER - only emit, no response
  openDevTool(hash: string): unknown
  sendNotification(
    title: string,
    notificationoption: NotificationConstructorOptions,
    openUrl?: string,
  ): void
  logout: () => void
  resizeLoginWindow(height: number): void
  resizePhoneIsland(size: Size): void
  openHostPage(path: string): void
  openExternalPage(url: string): void
  exitNethLink(): void
  copyToClipboard(text: string): void
}

const customElectronAPI = {
  ...electronAPI,
  send: (channel, ...data) => ipcRenderer.send(channel, ...data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
}

function setEmitterSync<T>(event): () => Promise<T> {
  return async (...args): Promise<T> => {
    return await new Promise((resolve, reject) => {
      // this timout is used to execute the react setters before sendSync freezes the UI
      setTimeout(() => {
        const [returnValue, err] = ipcRenderer.sendSync(event, ...args) as [
          T,
          Error | undefined,
        ]
        if (err) reject(err)
        else resolve(returnValue)
      }, 100)
    })
  }
}

function setEmitter(event) {
  return (...args: any[]) => {
    ipcRenderer.send(event, ...args)
  }
}
// @ts-ignore (define in dts)
// Custom APIs for renderer
const api: IElectronAPI = {
  env: process.env,
  appVersion: process.env['APP_VERSION'] || '0.0.1',
  platform: process.platform,
  osRelease: os.release(),
  arch: process.arch,
  i18nextElectronBackend: preloadBindings(ipcRenderer, process),
  // SYNC EMITTERS - expect response
  getLocale: setEmitterSync<string>(IPC_EVENTS.GET_LOCALE),

  // EMITTER - only emit, no response
  openDevTool: setEmitter(IPC_EVENTS.OPEN_DEV_TOOLS),
  logout: setEmitter(IPC_EVENTS.LOGOUT),
  resizePhoneIsland: setEmitter(IPC_EVENTS.PHONE_ISLAND_RESIZE),
  resizeLoginWindow: setEmitter(IPC_EVENTS.LOGIN_WINDOW_RESIZE),
  openHostPage: setEmitter(IPC_EVENTS.OPEN_HOST_PAGE),
  openExternalPage: setEmitter(IPC_EVENTS.OPEN_EXTERNAL_PAGE),
  exitNethLink: setEmitter(IPC_EVENTS.CLOSE_NETH_LINK),
  copyToClipboard: setEmitter(IPC_EVENTS.COPY_TO_CLIPBOARD),
  sendNotification: setEmitter(IPC_EVENTS.SEND_NOTIFICATION),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', customElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = customElectronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
