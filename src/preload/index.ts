import { NotificationConstructorOptions, contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS } from '@shared/constants'
import {
  Account,
  ContactType,
} from '@shared/types'
import { preloadBindings } from 'i18next-electron-fs-backend'

export interface IElectronAPI {
  env: NodeJS.ProcessEnv

  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  //TRANSLATIONS
  i18nextElectronBackend: any

  //SYNC EMITTERS - expect response
  login: (host: string, username: string, password: string) => Promise<Account | undefined>
  deleteSpeedDial(contact: ContactType): Promise<string>
  getLocale(): Promise<string>
  onStartCall(callback: (number: string | number) => void): void
  onUpdateAppNotification(showUpdateAppNotification: () => void): void


  //EMITTER - only emit, no response
  openDevTool(hash: string): unknown
  sendNotification(notificationoption: NotificationConstructorOptions, openUrl: string | undefined): void
  logout: () => void
  startCall(phoneNumber: string): void
  hideLoginWindow(): void
  resizeLoginWindow(height: number): void
  resizePhoneIsland(offsetWidth: number, offsetHeight: number): void
  sendInitializationCompleted(id: string): void
  openHostPage(path: string): void
  openExternalPage(url: string): void
  exitNethLink(): void
  hidePhoneIsland(): void
  showPhoneIsland(): void

}

const customElectronAPI = {
  ...electronAPI,
  send: (channel, ...data) => ipcRenderer.send(channel, ...data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}

function addListener(channel) {
  return (callback) => {
    ipcRenderer.on(channel, (e: Electron.IpcRendererEvent, ...args) => {
      callback(...args)
    })
  }
}

function setEmitterSync<T>(event): () => Promise<T> {
  return async (...args): Promise<T> => {
    return await new Promise((resolve, reject) => {
      //this timout is used to execute the react setters before sendSync freezes the UI
      setTimeout(() => {
        const [returnValue, err] = ipcRenderer.sendSync(event, ...args) as [T, Error | undefined]
        if (err) reject(err)
        else resolve(returnValue)
      }, 100);
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
  i18nextElectronBackend: preloadBindings(ipcRenderer, process),
  //SYNC EMITTERS - expect response
  login: setEmitterSync<Account | undefined>(IPC_EVENTS.LOGIN),
  getLocale: setEmitterSync<string>(IPC_EVENTS.GET_LOCALE),

  //EMITTER - only emit, no response
  sendInitializationCompleted: setEmitter(IPC_EVENTS.INITIALIZATION_COMPELTED),
  sendNotification: setEmitter(IPC_EVENTS.SEND_NOTIFICATION),
  openDevTool: setEmitter(IPC_EVENTS.OPEN_DEV_TOOLS),
  hideLoginWindow: setEmitter(IPC_EVENTS.HIDE_LOGIN_WINDOW),
  logout: setEmitter(IPC_EVENTS.LOGOUT),
  resizePhoneIsland: setEmitter(IPC_EVENTS.PHONE_ISLAND_RESIZE),
  resizeLoginWindow: setEmitter(IPC_EVENTS.LOGIN_WINDOW_RESIZE),
  openHostPage: setEmitter(IPC_EVENTS.OPEN_HOST_PAGE),
  openExternalPage: setEmitter(IPC_EVENTS.OPEN_EXTERNAL_PAGE),
  exitNethLink: setEmitter(IPC_EVENTS.CLOSE_NETH_LINK),
  hidePhoneIsland: setEmitter(IPC_EVENTS.HIDE_PHONE_ISLAND),
  showPhoneIsland: setEmitter(IPC_EVENTS.SHOW_PHONE_ISLAND),

  //LISTENERS - receive data async
  onUpdateAppNotification: addListener(IPC_EVENTS.UPDATE_APP_NOTIFICATION),

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
