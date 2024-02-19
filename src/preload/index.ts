import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'

export interface IElectronAPI {
  resizePhoneIsland(offsetWidth: number, offsetHeight: number): void
  sendInitializationCompleted(id: string): unknown
  onAccountChange(
    updateAccount: (
      e: IpcRendererEvent,
      account: import('@shared/types').Account | undefined
    ) => void
  ): unknown
  onDataConfigChange(
    updateDataConfig: (event: IpcRendererEvent, dataConfig: string | undefined) => void
  ): void
  onReceiveSpeeddials(saveSpeeddials: (speeddialsResponse: any) => Promise<void>): unknown
  onReciveLastCalls(
    saveMissedCalls: (historyResponse: import('@shared/types').HistoryCallData) => Promise<void>
  ): unknown
  login: (
    host: string,
    username: string,
    password: string
  ) => Promise<import('@shared/types').Account>
  logout: () => void
  loadAccounts: () => Promise<import('@shared/types').Account[]>
  startCall(phoneNumber: string): void
  onStartCall(callback: (event: IpcRendererEvent, ...args: any[]) => void): void

  (funcName: PHONE_ISLAND_EVENTS): () => void
}

function addListener(event) {
  return (callback) => ipcRenderer.on(event, callback)
}

function setEmitterSync(event) {
  return (...args) => ipcRenderer.sendSync(event, ...args)
}

function setEmitter(event) {
  return (...args) => {
    ipcRenderer.send(event, ...args)
  }
}
// @ts-ignore (define in dts)
// Custom APIs for renderer
const api: IElectronAPI = {
  //SYNC EMITTERS - expect response
  login: setEmitterSync(IPC_EVENTS.LOGIN),
  loadAccounts: setEmitterSync(IPC_EVENTS.LOAD_ACCOUNTS),

  //EMITTER - only emit, no response
  logout: setEmitter(IPC_EVENTS.LOGOUT),
  startCall: setEmitter(IPC_EVENTS.START_CALL),
  sendInitializationCompleted: setEmitter(IPC_EVENTS.INITIALIZATION_COMPELTED),
  resizePhoneIsland: setEmitter(IPC_EVENTS.PHONE_ISLAND_RESIZE),

  //LISTENERS - receive data async
  onStartCall: addListener(IPC_EVENTS.EMIT_START_CALL),
  onDataConfigChange: addListener(IPC_EVENTS.ON_DATA_CONFIG_CHANGE),
  onAccountChange: addListener(IPC_EVENTS.ACCOUNT_CHANGE),
  onReceiveSpeeddials: addListener(IPC_EVENTS.RECEIVE_SPEEDDIALS),
  onReciveLastCalls: addListener(IPC_EVENTS.RECEIVE_HISTORY_CALLS),

  //PHONE ISLAND EVENTS:
  [`${PHONE_ISLAND_EVENTS['phone-island-main-presence']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-main-presence']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-conversations']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-conversations']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-queue-update']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-queue-update']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-queue-member-update']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-queue-member-update']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-user-already-login']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-user-already-login']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-server-reloaded']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-server-reloaded']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-server-disconnected']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-server-disconnected']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-socket-disconnected']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-socket-disconnected']
  ),
  [`${PHONE_ISLAND_EVENTS['phone-island-parking-update']}`]: setEmitter(
    PHONE_ISLAND_EVENTS['phone-island-parking-update']
  )
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
