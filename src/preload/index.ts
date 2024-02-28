import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account, AvailableThemes, HistoryCallData, SearchCallData } from '@shared/types'

export type SyncResponse<T> = [T, Error]

export interface IElectronAPI {
  //SYNC EMITTERS - expect response
  login: (host: string, username: string, password: string) => Promise<Account | undefined>

  //LISTENERS - receive data async
  onAccountChange(updateAccount: (account: Account | undefined) => void): void
  onDataConfigChange(updateDataConfig: (dataConfig: string | undefined) => void): void
  onReceiveSpeeddials(saveSpeeddials: (speeddialsResponse: any) => void): void
  onReceiveLastCalls(saveMissedCalls: (historyResponse: HistoryCallData) => void): void
  onLoadAccounts(callback: (accounts: Account[]) => void): void
  onStartCall(callback: (number: string | number) => void): void
  onSearchResult(callback: (serachResults: SearchCallData) => void): void

  //EMITTER - only emit, no response
  logout: () => void
  startCall(phoneNumber: string): void
  changeTheme(theme: AvailableThemes): void
  sendSearchText(search: string): void
  hideLoginWindow(): void
  resizeLoginWindow(height: number): void
  resizePhoneIsland(offsetWidth: number, offsetHeight: number): void
  sendInitializationCompleted(id: string): void
  addPhoneIslandListener: (event: PHONE_ISLAND_EVENTS, callback: (...args: any[]) => void) => void
  openMissedCallsPage: (url: string) => void

  //PHONE ISLAND EVENTS:
  (funcName: PHONE_ISLAND_EVENTS): () => void
}

function addListener(channel) {
  return (callback) => {
    ipcRenderer.on(channel, (e: Electron.IpcRendererEvent, ...args) => {
      callback(...args)
    })
  }
}

function setEmitterSync<T>(event): () => Promise<T> {
  return (...args): Promise<T> => {
    return new Promise((resolve) => {
      const res = ipcRenderer.sendSync(event, ...args)
      resolve(res)
    })
  }
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
  login: setEmitterSync<Account | undefined>(IPC_EVENTS.LOGIN),

  //EMITTER - only emit, no response
  hideLoginWindow: setEmitter(IPC_EVENTS.HIDE_LOGIN_WINDOW),
  logout: setEmitter(IPC_EVENTS.LOGOUT),
  startCall: setEmitter(IPC_EVENTS.START_CALL),
  sendInitializationCompleted: setEmitter(IPC_EVENTS.INITIALIZATION_COMPELTED),
  resizePhoneIsland: setEmitter(IPC_EVENTS.PHONE_ISLAND_RESIZE),
  resizeLoginWindow: setEmitter(IPC_EVENTS.LOGIN_WINDOW_RESIZE),
  changeTheme: setEmitter(IPC_EVENTS.CHANGE_THEME),
  sendSearchText: setEmitter(IPC_EVENTS.SEARCH_TEXT),
  openMissedCallsPage: setEmitter(IPC_EVENTS.OPEN_MISSED_CALLS_PAGE),

  //LISTENERS - receive data async
  onLoadAccounts: addListener(IPC_EVENTS.LOAD_ACCOUNTS),
  onStartCall: addListener(IPC_EVENTS.EMIT_START_CALL),
  onDataConfigChange: addListener(IPC_EVENTS.ON_DATA_CONFIG_CHANGE),
  onAccountChange: addListener(IPC_EVENTS.ACCOUNT_CHANGE),
  onReceiveSpeeddials: addListener(IPC_EVENTS.RECEIVE_SPEEDDIALS),
  onReceiveLastCalls: addListener(IPC_EVENTS.RECEIVE_HISTORY_CALLS),
  onSearchResult: addListener(IPC_EVENTS.RECEIVE_SEARCH_RESULT),

  addPhoneIslandListener: (event, callback) => {
    const evName = `on-${event}`
    const listener = addListener(evName)
    listener(callback)
  },

  //PHONE ISLAND EVENTS:
  ...Object.keys(PHONE_ISLAND_EVENTS).reduce((p, ev) => {
    p[`${ev}`] = setEmitter(ev)
    return p
  }, {})
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
