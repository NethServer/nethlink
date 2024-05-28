import { join } from 'path'
import fs from 'fs'
import { Account, ConfigFile } from '@shared/types'
import { NethVoiceAPI } from './NethCTIController'
import { log } from '@shared/utils/logger'
import { safeStorage } from 'electron'
import { PhoneIslandController } from './PhoneIslandController'

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
    log("Config file folder:", this._getPaths().CONFIG_FILE)
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

  //saves the account data in the config.json file
  _saveNewAccountData(account: Account | undefined, isOpening = false, cryptString?: Buffer) {
    const { CONFIG_FILE } = this._getPaths()
    const config = this._getConfigFile(isOpening)
    const lastUser = config.lastUser
    if (account) {
      const uniqueAccountName = `${account.host}@${account.username}`
      if (cryptString)
        account.cryptPsw = cryptString
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
    if (lastUser !== account?.username || isOpening) {
      log('fire event', account ? 'LOGIN' : 'LOGOUT')
      this.fireEvent(account ? 'LOGIN' : 'LOGOUT', account || config.accounts[config.lastUser!])
    }
  }

  listAvailableAccounts(): Account[] {
    let accounts
    try {
      const config = this._getConfigFile()
      accounts = config.accounts
      return Object.values(accounts || {})
    } catch (e) {
      log("ERROR on listAvailableAccounts:", e)
      return []
    }
  }

  async logout(isSoft: boolean = false) {
    const account = this.getLoggedAccount()
    log('On logout account', account?.username, { isSoft })
    const API = NethVoiceAPI.api()
    try {
      await PhoneIslandController.instance.logout(account!)
      await API.Authentication.logout()
      log(`${account!.username} logout succesfully`)
    } catch (e) {
      console.error(e)
    } finally {
      if (!isSoft)
        this._saveNewAccountData(undefined, false)
    }

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
      //retrieve the saved password and attempt a new login
      if (account.cryptPsw) {
        try {
          const psw: Buffer = Buffer.from((account.cryptPsw as any).data)
          const decryptString = safeStorage.decryptString(psw)

          const _accountData = JSON.parse(decryptString)
          const password = _accountData.password
          const tempAccount: Account = {
            host: _accountData.host,
            username: _accountData.username,
            theme: 'system'
          }
          loggedAccount = await this.login(tempAccount, password)
        } catch (e) {
          log(e)
        }
      } else {
        //if he fails, the token was expired, I remove him as the last user so that he does not try further to log in with the token
        this.config!.lastUser = undefined
      }
    }
    this._saveNewAccountData(loggedAccount, isOpening)
    if (loggedAccount) return loggedAccount
    throw new Error('UnAuthorized')
  }

  async login(account: Account, password: string): Promise<Account> {
    const api = new NethVoiceAPI(account.host, account)
    const loggedAccount = await api.Authentication.login(account.username, password)
    const clearString = JSON.stringify({ host: account.host, username: account.username, password: password })
    const cryptString = safeStorage.encryptString(clearString)
    this._saveNewAccountData(loggedAccount, true, cryptString)
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

  removeAllEventListener() {
    this.eventListenerCallbacks = []
  }

  hasConfigsFolderOfFile() {
    const { CONFIG_PATH, CONFIG_FILE } = this._getPaths()
    const folderExist = fs.existsSync(CONFIG_PATH)
    if (folderExist) {
      try {
        const data = fs.readFileSync(CONFIG_FILE, { encoding: 'utf-8' })
        const config = JSON.parse(data)
        return Object.keys(config).includes('accounts')
      } catch (e) {
        //if it fails to transform the file to json then it is not well written and therefore I cannot move forward
        log(e)
        return false
      }
    }
    return false
  }

  createConfigFile() {
    const { CONFIG_PATH, CONFIG_FILE } = this._getPaths()
    //I check if the configs folder exists, if not, I create it

    if (!this.hasConfigsFolderOfFile()) {
      log("create config file")
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
