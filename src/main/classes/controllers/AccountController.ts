import { join } from 'path'
import fs from 'fs'
import { Account, ConfigFile } from '@shared/types'
import { NethVoiceAPI } from './NethCTIController'
import { platform } from 'os'

const defaultConfig: ConfigFile = {
  lastUser: undefined,
  accounts: {}
}

export class AccountController {
  _app: Electron.App | undefined
  private _authPollingInterval: NodeJS.Timeout | undefined
  private config: ConfigFile | undefined
  static instance: AccountController

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
  _onAccountChange: ((account: Account | undefined) => void) | undefined
  _saveNewAccountData(account: Account | undefined, isOpening = false) {
    const { CONFIG_FILE } = this._getPaths()
    const config = this._getConfigFile()
    console.log('save account', config.lastUser, account?.username, isOpening)
    if (config.lastUser !== account?.username || isOpening) {
      this._onAccountChange!(account)
    }
    if (account) {
      config.accounts[account.username] = account
      config.lastUser = account.username
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
    const accounts = this._getConfigFile()?.accounts
    if (accounts) {
      return Object.values(accounts || {})
    }
    return []
  }

  async logout() {
    const account = this.getLoggedAccount()
    const api = new NethVoiceAPI(account!.host, account)
    this._saveNewAccountData(undefined, false)
    api.Authentication.logout()
      .then(() => {
        console.log(`${account!.username} logout succesfully`)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  getLoggedAccount() {
    console.log(this.config?.lastUser)
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

  onAccountChange(callback: (account: Account | undefined) => void) {
    this._onAccountChange = callback
  }

  hasConfigsFolder() {
    const { CONFIG_PATH } = this._getPaths()
    console.log(CONFIG_PATH)
    return fs.existsSync(CONFIG_PATH)
  }

  createConfigFile() {
    const { CONFIG_PATH, CONFIG_FILE } = this._getPaths()
    //Controllo se la cartella configs esiste, altrimenti la creo

    if (!this.hasConfigsFolder()) {
      fs.mkdirSync(CONFIG_PATH)
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig), 'utf-8')
    } else {
      throw new Error(`Unable to overwrite ${CONFIG_FILE}`)
    }
  }

  _getConfigFile(): ConfigFile {
    const { CONFIG_FILE } = this._getPaths()

    if (this.hasConfigsFolder()) {
      const data = fs.readFileSync(CONFIG_FILE, { encoding: 'utf-8' })
      this.config = JSON.parse(data)
      return this.config!
    } else {
      throw new Error(`Unable to find ${CONFIG_FILE}`)
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
        () => {
          const account = this.config!.accounts[this.config!.lastUser!]
          this._tokenLogin(account)
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

  updatePhoneIslandPosition(position: { x: number; y: number }) {
    const account = this.getLoggedAccount()
    account!.phoneIslandPosition = position
    this._saveNewAccountData(account)
  }
}
