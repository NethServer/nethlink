import { join } from 'path'
import fs from 'fs'
import { Account, ConfigFile } from '@shared/types'
import { NethVoiceAPI } from './NethCTIController'

const defaultConfig: ConfigFile = {
  lastUser: undefined,
  accounts: {
    lorenzo: {
      host: 'https://cti.demo-heron.sf.nethserver.net',
      username: 'lorenzo'
    }
  }
}

export class AccountController {
  listAvailableAccounts(): any {
    throw new Error('Method not implemented.')
  }
  logout() {
    throw new Error('Method not implemented.')
  }
  _app: Electron.App | undefined
  _onAccountChange: ((account: Account) => void) | undefined
  config: ConfigFile | undefined
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

  _saveNewAccountData(account: Account, isOpening: boolean) {
    const { CONFIG_FILE } = this._getPaths()
    console.log('save account', this.config!.lastUser, account.username, isOpening)
    if (this.config!.lastUser !== account.username || isOpening) {
      this._onAccountChange!(account)
    }
    this.config!.accounts[account.username] = account
    this.config!.lastUser = account.username
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config), 'utf-8')
  }

  getLoggedAccount() {
    return this.config!.accounts[this.config!.lastUser!]
  }
  async _tokenLogin(account: Account, isOpening: boolean = false): Promise<Account> {
    const api = new NethVoiceAPI(account.host, account)
    const loggedAccount = await api.User.me()
    this._saveNewAccountData(loggedAccount, isOpening)
    return loggedAccount
  }

  async login(account: Account, password: string): Promise<Account> {
    const api = new NethVoiceAPI(account.host, account)
    const loggedAccount = await api.Authentication.login(account.username, password)
    this._saveNewAccountData(loggedAccount, true)
    return loggedAccount
  }

  onAccountChange(callback: (account: Account) => void) {
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

  getConfigFile(): ConfigFile {
    const { CONFIG_FILE } = this._getPaths()

    if (this.hasConfigsFolder()) {
      const data = fs.readFileSync(CONFIG_FILE, { encoding: 'utf-8' })
      this.config = JSON.parse(data)
      return this.config!
    } else {
      throw new Error(`Unable to find ${CONFIG_FILE}`)
    }
  }

  async autologin(isOpening: boolean = false): Promise<Account> {
    const error = new Error('Unable to login')
    if (!this.config) throw error
    if (!this.config.lastUser) throw error
    const account = this.config.accounts[this.config.lastUser]
    if (!account) throw error
    return this._tokenLogin(account, isOpening)
  }
}
