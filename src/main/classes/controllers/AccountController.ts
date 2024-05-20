import { join } from 'path'
import fs from 'fs'
import { Account, ConfigFile } from '@shared/types'
import { NethVoiceAPI } from './NethCTIController'
import { log } from '@shared/utils/logger'

const defaultConfig: ConfigFile = {
  lastUser: undefined,
  accounts: {}
}

type EventCallback = (...args: any[]) => void | Promise<void>
type EventListenerCallback = {
  event: keyof typeof AccountEvents
  callback: EventCallback
}
export enum AccountEvents {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT'
}

export class AccountController {
  _app: Electron.App | undefined
  private _authPollingInterval: NodeJS.Timeout | undefined
  private config: ConfigFile | undefined
  static instance: AccountController

  private eventListenerCallbacks: EventListenerCallback[] = []

  constructor(app: Electron.App) {
    this._app = app
    AccountController.instance = this
  }

  _getPaths() {
    const BASE_URL = this._app!.getPath('userData')
    const CONFIG_PATH = join(BASE_URL, 'configs')
    const CONFIG_FILE = join(CONFIG_PATH, 'config.json')
    return { BASE_URL, CONFIG_PATH, CONFIG_FILE }
  }
  private fireEvent(event: keyof typeof AccountEvents, ...args: any[]) {
    for (const listener of this.eventListenerCallbacks.filter((e) => e.event === event)) {
      listener.callback(...args)
    }
  }

  //salva i dati dell'account nel file config.json
  _saveNewAccountData(account: Account | undefined, isOpening = false) {
    const { CONFIG_FILE } = this._getPaths()
    const config = this._getConfigFile(isOpening)
    //log('save account', config.lastUser, account?.username, isOpening)
    if (config.lastUser !== account?.username || isOpening) {
      this.fireEvent(account ? 'LOGIN' : 'LOGOUT', account || config.accounts[config.lastUser!])
    }
    if (account) {
      const uniqueAccountName = `${account.host}@${account.username}`
      config.accounts[uniqueAccountName] = account
      config.lastUser = uniqueAccountName
    } else {
      if (config.lastUser) {
        config.accounts[config.lastUser].accessToken = undefined
      }
      config.lastUser = undefined
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config), 'utf-8')
    this.config = config
  }

  listAvailableAccounts(): Account[] {
    let accounts
    try {
      const config = this._getConfigFile()
      accounts = config.accounts
      return Object.values(accounts || {})
    } catch (e) {
      log(e)
      return []
    }
  }

  async logout() {
    const account = this.getLoggedAccount()
    const api = new NethVoiceAPI(account!.host, account)
    this._saveNewAccountData(undefined, false)
    api.Authentication.logout()
      .then(() => {
        log(`${account!.username} logout succesfully`)
      })
      .catch((e) => {
        console.error(e)
      })
  }

  getLoggedAccount() {
    if (this.config?.lastUser) {
      return this.config!.accounts[this.config!.lastUser!]
    }
    return undefined
  }

  async _tokenLogin(account: Account, isOpening = false): Promise<Account> {
    const api = new NethVoiceAPI(account.host, account)
    let loggedAccount: Account | undefined = undefined
    try {
      loggedAccount = await api.User.me()
    } catch {
      //se fallisce, il token era scaduto, lo rimuovo come ultimo utente in modo che non provi ulteriomente a loggarsi con il token
      this.config!.lastUser = undefined
    }
    this._saveNewAccountData(loggedAccount, isOpening)
    if (loggedAccount) return loggedAccount
    throw new Error('UnAuthorized')
  }

  async login(account: Account, password: string): Promise<Account> {
    const api = new NethVoiceAPI(account.host, account)
    const loggedAccount = await api.Authentication.login(account.username, password)
    this._saveNewAccountData(loggedAccount, true)
    return loggedAccount
  }

  addEventListener(event: keyof typeof AccountEvents, callback: EventCallback) {
    this.eventListenerCallbacks.push({
      event,
      callback
    })
  }

  removeEventListener(event: keyof typeof AccountEvents, callback: EventCallback) {
    const idx = this.eventListenerCallbacks.findIndex(
      (e) => e.event === event && e.callback === callback
    )
    this.eventListenerCallbacks.splice(idx, 1)
  }

  hasConfigsFolderOfFile() {
    const { CONFIG_PATH, CONFIG_FILE } = this._getPaths()
    log('CONFIG_PATH', CONFIG_PATH)
    const folderExist = fs.existsSync(CONFIG_PATH)
    if (folderExist) {
      try {
        const data = fs.readFileSync(CONFIG_FILE, { encoding: 'utf-8' })
        const config = JSON.parse(data)
        //log(config)
        return Object.keys(config).includes('accounts')
      } catch (e) {
        //se non riesce a trasformare il file in json allora non è ben scritto e quindi non posso andare avanti
        log(e)
        return false
      }
    }
    return false
  }

  createConfigFile() {
    const { CONFIG_PATH, CONFIG_FILE } = this._getPaths()
    //Controllo se la cartella configs esiste, altrimenti la creo

    if (!this.hasConfigsFolderOfFile()) {
      //log('ENOENT')
      try {
        fs.mkdirSync(CONFIG_PATH)
      } catch (e) {
        log(e)
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig), 'utf-8')
    } else {
      throw new Error(`Unable to overwrite ${CONFIG_FILE}`)
    }
  }

  _getConfigFile(isOpeninig: boolean = false): ConfigFile {
    const { CONFIG_FILE } = this._getPaths()

    if (this.hasConfigsFolderOfFile()) {
      const data = fs.readFileSync(CONFIG_FILE, { encoding: 'utf-8' })
      this.config = JSON.parse(data)
      return this.config!
    } else {
      if (isOpeninig) {
        this.createConfigFile()
        return this._getConfigFile()
      } else throw new Error(`Unable to find ${CONFIG_FILE}`)
    }
  }

  async autologin(isOpening = false): Promise<Account> {
    this._getConfigFile()
    const error = new Error('Unable to login')
    if (!this.config) throw error
    if (!this.config.lastUser) throw error
    const account = this.config.accounts[this.config.lastUser]
    if (!account) throw error
    return await this._tokenLogin(account, isOpening)
  }

  startAuthPolling() {
    if (!this._authPollingInterval) {
      this._authPollingInterval = setInterval(
        async () => {
          const account = this.config!.accounts[this.config!.lastUser!]
          try {
            await this._tokenLogin(account)
          } catch (e) {
            log(e)
            this.logout()
          }
          // Set timer to 45 minutes
        },
        1000 * 45 * 60
      )
    } else {
      throw new Error('Auth Polling is already started')
    }
  }

  stopAuthPolling() {
    clearInterval(this._authPollingInterval)
  }

  updateTheme(theme: any) {
    const account = this.getLoggedAccount()
    account!.theme = theme
    this._saveNewAccountData(account)
  }

  getAccountPhoneIslandPosition(): { x: number; y: number } | undefined {
    const config = this.config
    if (config?.lastUser) {
      return config.accounts[config.lastUser].phoneIslandPosition
    }
    return undefined
  }

  setAccountPhoneIslandPosition(phoneIslandPosition: { x: number; y: number }): void {
    const config = this.config
    const { CONFIG_FILE } = this._getPaths()
    if (config?.lastUser) {
      config.accounts[config.lastUser].phoneIslandPosition = phoneIslandPosition
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config), 'utf-8')
    }
  }
}
