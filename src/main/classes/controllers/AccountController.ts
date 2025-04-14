import { Account, AuthAppData, AvailableDevices, ConfigFile } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { safeStorage } from 'electron'
import { store } from '@/lib/mainStore'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { useLogin } from '@shared/useLogin'
import { NetworkController } from './NetworkController'
import { getAccountUID } from '@shared/utils/utils'

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
  static instance: AccountController
  private NethVoiceAPI = useNethVoiceAPI().NethVoiceAPI

  constructor(app: Electron.App) {
    this._app = app
    AccountController.instance = this
  }

  listAvailableAccounts(): Account[] {
    const authAppData = store.store.auth
    if (authAppData) return Object.values(authAppData.availableAccounts)
    return []
  }

  async logout() {
    store.updateStore({
      auth: {
        ...store.store.auth!,
        lastUser: undefined,
        lastUserCryptPsw: undefined
      },
      account: undefined,
      theme: store.store.theme,
      connection: store.store.connection || false,
      accountStatus: store.store.accountStatus || 'offline',
      isCallsEnabled: store.store.isCallsEnabled || false,
      lastDevice: store.store.lastDevice || undefined
    }, 'logout')
    store.saveToDisk()
  }

  async autoLogin(): Promise<boolean> {
    //
    const authAppData = store.store.auth
    if (authAppData?.lastUser) {
      const lastLoggedAccount = authAppData.availableAccounts[authAppData.lastUser]
      if (lastLoggedAccount && authAppData.lastUserCryptPsw) {
        try {
          try {
            const bfs = Object.values(authAppData.lastUserCryptPsw) as any;
            if (bfs[0] === 'Buffer') {
              authAppData.lastUserCryptPsw = bfs[1]
            } else {
              authAppData.lastUserCryptPsw = bfs
            }
          } catch (e) {
            Log.warning('auto login failed decrypt user:', e)
          }
          const psw: Buffer = Buffer.from((authAppData.lastUserCryptPsw as Uint8Array))
          const decryptString = safeStorage.decryptString(psw)
          const _accountData = JSON.parse(decryptString)
          const password = _accountData.password
          const tempLoggedAccount = await this.NethVoiceAPI.Authentication.login(lastLoggedAccount.host, lastLoggedAccount.username, password)
          let loggedAccount: Account = {
            ...lastLoggedAccount,
            ...tempLoggedAccount,
            theme: lastLoggedAccount.theme || tempLoggedAccount.theme
          }

          const { parseConfig } = useLogin()
          const config: string = await NetworkController.instance.get(`https://${loggedAccount.host}/config/config.production.js`)
          loggedAccount = parseConfig(loggedAccount, config)
          await this.saveLoggedAccount(loggedAccount, password)
          return true
        } catch (e) {
          Log.warning('auto login failed:', e)
          return false
        }
      }
    }
    return false
  }

  async saveLoggedAccount(account: Account, password: string): Promise<Account> {
    try {
      //
      const clearString = JSON.stringify({ host: account.host, username: account.username, password: password })
      const cryptString = safeStorage.encryptString(clearString)
      const accountUID = getAccountUID(account)
      store.updateStore({
        account,
        theme: account.theme,
        auth: {
          availableAccounts: {
            ...store.store.auth?.availableAccounts,
            [accountUID]: account
          },
          isFirstStart: false,
          lastUser: accountUID,
          lastUserCryptPsw: cryptString
        },
        device: account.data?.default_device ? {
          type: account.data.default_device.type as AvailableDevices,
          id: account.data.default_device.id,
        } : undefined,
        connection: store.store.connection || false,
        accountStatus: store.store.accountStatus || 'offline',
        isCallsEnabled: store.store.isCallsEnabled || false,
        lastDevice: store.store.lastDevice || undefined
      }, 'saveLoggedAccount')
      store.saveToDisk()
      return account
    } catch (e) {
      Log.error('during save logged account data', e)
      this.logout()
      throw e
    }
  }



  updateTheme(theme: any) {
    if (store.store) {
      const account = store.store.account
      store.set('theme', theme)
      if (account) {
        account.theme = theme

        store.set('account', account)
        const auth = store.store.auth

        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth)
      }
      store.saveToDisk()
    }
  }

  updateShortcut(shortcut: any) {
    if (store.store) {
      const account = store.store.account
      if (account) {
        account.shortcut = shortcut
        store.set('account', account)
        const auth = store.store.auth

        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth)
      }
      store.saveToDisk()
    }
  }


  getAccountPhoneIslandPosition(): { x: number; y: number } | undefined {
    return store.store.account?.phoneIslandPosition
  }

  setAccountPhoneIslandPosition(phoneIslandPosition: { x: number; y: number }): void {
    const account = store.store.account
    const auth = store.store.auth
    if (account) {
      account!.phoneIslandPosition = phoneIslandPosition
      store.set('account', account)
      const _auth = {
        ...auth,
        availableAccounts: {
          ...auth?.availableAccounts,
          [getAccountUID(account)]: account
        }
      }
      store.set('auth', _auth)
      store.saveToDisk()
    }
  }

  getAccountNethLinkBounds(): Electron.Rectangle | undefined {
    return store.store.account?.nethlinkBounds
  }

  setAccountNethLinkBounds(nethlinkBounds: Electron.Rectangle | undefined): void {
    const account = store.store.account
    Log.debug('MAIN PRESENCE BACK', account?.data?.mainPresence)
    const auth = store.store.auth
    if (account) {
      account!.nethlinkBounds = nethlinkBounds
      store.set('account', account)
      const _auth = {
        ...auth,
        availableAccounts: {
          ...auth?.availableAccounts,
          [getAccountUID(account)]: account
        }
      }
      store.set('auth', _auth)
      store.saveToDisk()
    }
  }
}
