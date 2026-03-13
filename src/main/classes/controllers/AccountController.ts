import { Account, AuthAppData, AvailableDevices, ConfigFile } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { safeStorage } from 'electron'
import { store } from '@/lib/mainStore'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { useLogin } from '@shared/useLogin'
import { NetworkController } from './NetworkController'
import { getAccountUID } from '@shared/utils/utils'
import { requires2FA, isJWTExpired } from '@shared/utils/jwt'

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

  /**
   * Wait for safeStorage encryption to become available
   * @param maxRetries Maximum number of retries (default 20)
   * @param delayMs Delay between retries in milliseconds (default 500)
   * @returns true if encryption became available, false if timed out
   */
  private async waitForSafeStorage(maxRetries: number = 20, delayMs: number = 500): Promise<boolean> {
    let retries = 0
    while (!safeStorage.isEncryptionAvailable() && retries < maxRetries) {
      Log.info(`waiting for safeStorage to become available (attempt ${retries + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      retries++
    }
    return safeStorage.isEncryptionAvailable()
  }

  listAvailableAccounts(): Account[] {
    const authAppData = store.store.auth
    if (authAppData) return Object.values(authAppData.availableAccounts)
    return []
  }

  async logout() {
    // Call API logout before clearing local data
    const account = store.store.account
    if (account) {
      try {
        const { NethVoiceAPI } = useNethVoiceAPI(account)
        await NethVoiceAPI.Authentication.phoneIslandTokenLogout()
        await NethVoiceAPI.Authentication.logout()
        Log.info('AccountController.logout() - logout API call completed successfully')
      } catch (e) {
        Log.warning('Error calling logout API:', e)
      }
    }

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
          // Wait for encryption to become available (max 10 seconds with 500ms intervals)
          if (!await this.waitForSafeStorage()) {
            Log.warning('auto login failed: safeStorage encryption not available after waiting')
            return false
          }
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

          // Check if saved token is still valid and doesn't require 2FA
          if (lastLoggedAccount.jwtToken) {
            if (!isJWTExpired(lastLoggedAccount.jwtToken)) {
              // Token is still valid locally, check if it requires 2FA
              if (requires2FA(lastLoggedAccount.jwtToken)) {
                Log.info('auto login failed: 2FA required, user interaction needed')
                return false
              }

              // Token looks valid locally, but we need to verify with server
              // The token might have been invalidated (e.g., 2FA disabled/enabled)
              Log.info('auto login: validating saved token with server...')

              try {
                // Make a simple API call to verify the token is still accepted by the server
                // Use the API client so path selection (/api vs /webrest) follows account settings/fallback logic
                const { NethVoiceAPI } = useNethVoiceAPI(lastLoggedAccount)
                await NethVoiceAPI.User.me()

                // If we get here, the token is valid on the server
                Log.info('auto login: token validated with server, using saved token')
              } catch (error: any) {
                // Token was rejected by server (401/403) or network error
                Log.info('auto login failed: saved token rejected by server', error?.response?.status || error?.message)
                return false
              }

              // Update store with the saved account (don't do a new login!)
              // IMPORTANT: Preserve auth.lastUser and auth.lastUserCryptPsw so they are saved to disk
              // IMPORTANT: Set connection: true to prevent "No internet connection" banner
              store.updateStore({
                account: lastLoggedAccount,
                theme: lastLoggedAccount.theme,
                connection: true,
                accountStatus: store.store.accountStatus || 'offline',
                isCallsEnabled: store.store.isCallsEnabled || false,
                auth: {
                  ...authAppData,
                  lastUser: authAppData.lastUser,
                  lastUserCryptPsw: authAppData.lastUserCryptPsw
                }
              }, 'autoLogin')

              return true
            } else {
              Log.info('auto login: saved token expired, need to re-login')
            }
          }

          // Token is expired or doesn't exist, do a new login
          const tempLoggedAccount = await this.NethVoiceAPI.Authentication.login(lastLoggedAccount.host, lastLoggedAccount.username, password)

          // Check if 2FA is required - auto-login should fail in this case
          if (tempLoggedAccount.jwtToken && requires2FA(tempLoggedAccount.jwtToken)) {
            Log.info('auto login failed: 2FA required, user interaction needed')
            return false
          }

          // Auto-login only works with JWT tokens (no legacy support)
          if (!tempLoggedAccount.jwtToken) {
            Log.info('auto login failed: no JWT token received')
            return false
          }

          let loggedAccount: Account = {
            ...lastLoggedAccount,
            ...tempLoggedAccount,
            theme: lastLoggedAccount.theme || tempLoggedAccount.theme,
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
      // Wait for encryption to become available (max 10 seconds with 500ms intervals)
      if (!await this.waitForSafeStorage()) {
        Log.error('saveLoggedAccount: safeStorage encryption not available after waiting')
        throw new Error('Encryption not available')
      }
      const clearString = JSON.stringify({ host: account.host, username: account.username, password: password })
      const cryptString = safeStorage.encryptString(clearString)
      const accountUID = getAccountUID(account)
      const authAppData = store.store.auth
      if (authAppData) {
        const accountPreviousData = authAppData.availableAccounts[accountUID]
        if (accountPreviousData) {
          account = {
            ...accountPreviousData,
            ...account
          }
        }
      }
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



  async updateTheme(theme: any) {
    if (store.store) {
      const account = store.store.account
      store.set('theme', theme, true)
      if (account) {
        account.theme = theme
        store.set('account', account, true)
        const auth = store.store.auth
        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth, true)
      }
      store.saveToDisk()
    }
  }

  async updatePreferredDevice(preferredDevices: any) {
    if (store.store) {
      const account = store.store.account
      if (account) {
        account.preferredDevices = preferredDevices

        store.set('account', account, true)
        const auth = store.store.auth

        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth, true)
      }
      store.saveToDisk()
    }
  }

  async updateShortcut(shortcut: any) {
    if (store.store) {
      const account = store.store.account
      if (account) {
        account.shortcut = shortcut

        store.set('account', account, true)
        const auth = store.store.auth

        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth, true)
      }
      store.saveToDisk()
    }
  }

  async updateCommandBarShortcut(commandBarShortcut: any) {
    if (store.store) {
      const account = store.store.account
      if (account) {
        account.commandBarShortcut = commandBarShortcut

        store.set('account', account, true)
        const auth = store.store.auth

        auth!.availableAccounts[getAccountUID(account)] = account
        store.set('auth', auth, true)
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
      store.set('account', account, true)
      const _auth = {
        ...auth,
        availableAccounts: {
          ...auth?.availableAccounts,
          [getAccountUID(account)]: account
        }
      }
      store.set('auth', _auth, true)
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
      store.set('account', account, true)
      const _auth = {
        ...auth,
        availableAccounts: {
          ...auth?.availableAccounts,
          [getAccountUID(account)]: account
        }
      }
      store.set('auth', _auth, true)
      store.saveToDisk()
    }
  }
}
