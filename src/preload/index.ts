import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import {
  Account,
  AvailableThemes,
  ContactType,
  HistoryCallData,
  NewContactType,
  NewSpeedDialType,
  OperatorData,
  SearchCallData
} from '@shared/types'
import { preloadBindings } from 'i18next-electron-fs-backend'
import { log } from '@shared/utils/logger'

export interface IElectronAPI {


  // Use `contextBridge` APIs to expose Electron APIs to
  // renderer only if context isolation is enabled, otherwise
  // just add to the DOM global.
  //TRANSLATIONS
  i18nextElectronBackend: any

  //SYNC EMITTERS - expect response
  login: (host: string, username: string, password: string) => Promise<Account | undefined>
  addContactToPhonebook(contact: ContactType): Promise<void>
  addContactSpeedDials(contact: NewContactType): Promise<ContactType[]>
  editSpeedDialContact(
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ): Promise<ContactType>
  deleteSpeedDial(contact: ContactType): Promise<string>
  getLocale(): Promise<string>

  //LISTENERS - receive data async
  onAccountChange(updateAccount: (account: Account | undefined) => void): void
  onDataConfigChange(
    updateDataConfig: (dataConfig: string | undefined, account: Account) => void
  ): void
  onReceiveSpeeddials(saveSpeeddials: (speeddialsResponse: any) => void): void
  onReceiveLastCalls(saveMissedCalls: (historyResponse: HistoryCallData) => void): void
  onLoadAccounts(callback: (accounts: Account[]) => void): void
  onStartCall(callback: (number: string | number) => void): void
  onSearchResult(callback: (searchResults: SearchCallData) => void): void
  onSystemThemeChange(callback: (theme: AvailableThemes) => void): void
  onThemeChange(callback: (theme: AvailableThemes) => void): void
  onOperatorsChange(callback: (updateOperators: OperatorData) => void): void

  //EMITTER - only emit, no response
  openDevTool(hash: string): unknown
  logout: () => void
  startCall(phoneNumber: string): void
  changeTheme(theme: AvailableThemes): void
  sendSearchText(search: string): void
  hideLoginWindow(): void
  resizeLoginWindow(height: number): void
  resizePhoneIsland(offsetWidth: number, offsetHeight: number): void
  sendInitializationCompleted(id: string): void
  addPhoneIslandListener: (event: PHONE_ISLAND_EVENTS, callback: (...args: any[]) => void) => void
  openHostPage(path: string): unknown
  hideNethLink: () => void
  exitNethLink: () => void
  showPhoneIsland: () => void
  hidePhoneIsland: () => void

  //PHONE ISLAND EVENTS:
  (funcName: PHONE_ISLAND_EVENTS): () => void
}

function addListener(channel) {
  return (callback) => {
    ipcRenderer.on(channel, (e: Electron.IpcRendererEvent, ...args) => {
      callback(...args)
      //log('listener', channel, ...args)
    })
  }
}

function setEmitterSync<T>(event): () => Promise<T> {
  return async (...args): Promise<T> => {
    return await new Promise((resolve, reject) => {
      //questo timout serve ad eseguire i setter di react prima che il sendSync metta in freeze la UI
      setTimeout(() => {
        const [returnValue, err] = ipcRenderer.sendSync(event, ...args) as [T, Error | undefined]
        //log('sync emitter', event, res)
        if (err) reject(err)
        else resolve(returnValue)
        //const res = ipcRenderer.sendSync(event, ...args)
        //resolve(res)
      }, 100);
    })
  }
}

function setEmitter(event) {
  return (...args: any[]) => {
    ipcRenderer.send(event, ...args)
    //log('emitter', event)
  }
}
// @ts-ignore (define in dts)
// Custom APIs for renderer
const api: IElectronAPI = {
  i18nextElectronBackend: preloadBindings(ipcRenderer, process),
  //SYNC EMITTERS - expect response
  login: setEmitterSync<Account | undefined>(IPC_EVENTS.LOGIN),
  addContactSpeedDials: setEmitterSync<ContactType[]>(IPC_EVENTS.ADD_CONTACT_SPEEDDIAL),
  addContactToPhonebook: setEmitterSync<void>(IPC_EVENTS.ADD_CONTACT_PHONEBOOK),
  editSpeedDialContact: setEmitterSync<ContactType>(IPC_EVENTS.EDIT_SPEEDDIAL_CONTACT),
  deleteSpeedDial: setEmitterSync<string>(IPC_EVENTS.DELETE_SPEEDDIAL),
  getLocale: setEmitterSync<string>(IPC_EVENTS.GET_LOCALE),

  //EMITTER - only emit, no response
  openDevTool: setEmitter(IPC_EVENTS.OPEN_DEV_TOOLS),
  hideLoginWindow: setEmitter(IPC_EVENTS.HIDE_LOGIN_WINDOW),
  logout: setEmitter(IPC_EVENTS.LOGOUT),
  startCall: setEmitter(IPC_EVENTS.START_CALL),
  sendInitializationCompleted: setEmitter(IPC_EVENTS.INITIALIZATION_COMPELTED),
  resizePhoneIsland: setEmitter(IPC_EVENTS.PHONE_ISLAND_RESIZE),
  resizeLoginWindow: setEmitter(IPC_EVENTS.LOGIN_WINDOW_RESIZE),
  changeTheme: setEmitter(IPC_EVENTS.CHANGE_THEME),
  sendSearchText: setEmitter(IPC_EVENTS.SEARCH_TEXT),
  openHostPage: setEmitter(IPC_EVENTS.OPEN_HOST_PAGE),
  hideNethLink: setEmitter(IPC_EVENTS.HIDE_NETH_LINK),
  exitNethLink: setEmitter(IPC_EVENTS.CLOSE_NETH_LINK),
  showPhoneIsland: setEmitter(IPC_EVENTS.SHOW_PHONE_ISLAND),
  hidePhoneIsland: setEmitter(IPC_EVENTS.HIDE_PHONE_ISLAND),

  //LISTENERS - receive data async
  onLoadAccounts: addListener(IPC_EVENTS.LOAD_ACCOUNTS),
  onStartCall: addListener(IPC_EVENTS.EMIT_START_CALL),
  onDataConfigChange: addListener(IPC_EVENTS.ON_DATA_CONFIG_CHANGE),
  onAccountChange: (callback) => {
    addListener(IPC_EVENTS.ACCOUNT_CHANGE)((account: Account | undefined) => {
      const API = account?.host.split('://') || ['', '']
      // @ts-ignore (define in dts)
      window.CONFIG = {
        PRODUCT_NAME: 'NethLink',
        COMPANY_NAME: 'Nethesis',
        COMPANY_SUBNAME: 'CTI',
        COMPANY_URL: 'https://www.nethesis.it/',
        API_ENDPOINT: account?.host,
        API_SCHEME: API[0] + '://',
        WS_ENDPOINT: 'wss://' + API[1] + 'ws'
      }
      callback(account)
    })
  },
  onReceiveSpeeddials: addListener(IPC_EVENTS.RECEIVE_SPEEDDIALS),
  onReceiveLastCalls: addListener(IPC_EVENTS.RECEIVE_HISTORY_CALLS),
  onSearchResult: addListener(IPC_EVENTS.RECEIVE_SEARCH_RESULT),
  onSystemThemeChange: addListener(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME),
  onThemeChange: addListener(IPC_EVENTS.ON_CHANGE_THEME),
  onOperatorsChange: addListener(IPC_EVENTS.OPERATORS_CHANGE),

  addPhoneIslandListener: (event, callback) => {
    const evName = `on-${event}`
    addListener(evName)(callback)
  },

  ...Object.keys(PHONE_ISLAND_EVENTS).reduce((p, event) => {
    return {
      ...p,
      [event]: setEmitter(event)
    }
  }, {})
}

//log(api)

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
