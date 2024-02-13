import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Account } from '@shared/types'
import { IPC_EVENTS } from '@shared/constants'

export interface IElectronAPI {
  login: (host: string, username: string, password: string) => Promise<Account>
  logout: () => void
  loadAccounts: () => Promise<Account[]>
  getAccount: () => Promise<Account>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSpeeddials(): Promise<any>
  openAllSpeeddials(): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLastCalls(): Promise<any>
  openAllCalls(): void
  openAddToPhonebook(): void
}

// Custom APIs for renderer
const api: IElectronAPI = {
  login: (...args) => ipcRenderer.sendSync(IPC_EVENTS.LOGIN, ...args),
  logout: () => ipcRenderer.send(IPC_EVENTS.LOGOUT),
  getAccount: () => ipcRenderer.sendSync(IPC_EVENTS.GET_ACCOUNT),
  loadAccounts: () => ipcRenderer.sendSync(IPC_EVENTS.LOAD_ACCOUNTS),
  getSpeeddials: () => ipcRenderer.sendSync(IPC_EVENTS.GET_SPEED_DIALS),
  openAllSpeeddials: () => ipcRenderer.send(IPC_EVENTS.OPEN_SPEEDDIALS_PAGE),
  getLastCalls: () => ipcRenderer.sendSync(IPC_EVENTS.GET_LAST_CALLS),
  openAllCalls: () => ipcRenderer.send(IPC_EVENTS.OPEN_ALL_CALLS_PAGE),
  openAddToPhonebook: () => ipcRenderer.send(IPC_EVENTS.OPEN_ADD_TO_PHONEBOOK_PAGE)
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
