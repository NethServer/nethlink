import moment from 'moment'
import hmacSHA1 from 'crypto-js/hmac-sha1'
import {
  Account,
  AuthenticationMethod,
  NewContactType,
  OperatorData,
  ContactType,
  NewSpeedDialType,
  Extension,
  StatusTypes,
  OperatorsType,
  AccountData,
  BaseAccountData,
  ExtensionsType,
  PasswordInfo,
} from '@shared/types'
import { Log } from '@shared/utils/logger'
import { normalizeSharedGroups, serializeSharedGroups } from './phonebook'
import { useNetwork } from './useNetwork'
import { SpeeddialTypes } from './constants'
import { decodeJWT, requires2FA } from '@shared/utils/jwt'

// Base paths for API endpoints (fallback from /api to /webrest)
const PRIMARY_API_BASE_PATH = '/api'
const FALLBACK_API_BASE_PATH = '/webrest'

function getNethlinkClientInfo(): {
  nethlink_version: string
  os_type: string
  os_release: string
  arch: string
} {
  const api = typeof window !== 'undefined' ? (window as any).api : undefined
  if (api) {
    return {
      nethlink_version: api.appVersion || '',
      os_type: api.platform || '',
      os_release: api.osRelease || '',
      arch: api.arch || '',
    }
  }
  return {
    nethlink_version:
      (typeof process !== 'undefined' && process.env?.['APP_VERSION']) || '',
    os_type: typeof process !== 'undefined' ? process.platform : '',
    os_release: '',
    arch: typeof process !== 'undefined' ? process.arch : '',
  }
}

export const useNethVoiceAPI = (
  loggedAccount: Account | undefined = undefined,
) => {
  const { GET, POST, DELETE } = useNetwork()
  let isFirstHeartbeat = true
  let account: Account | undefined = loggedAccount || undefined
  // The API path is decided at login and follows the token it produced:
  // only a legacy hash token, given by a PBX without the middleware, uses
  // /webrest. The stored apiBasePath is not trusted, older releases saved
  // /webrest after any 404 and the account would stay stuck there.
  let currentApiBasePath =
    account?.accessToken && !account?.jwtToken
      ? FALLBACK_API_BASE_PATH
      : PRIMARY_API_BASE_PATH

  Log.debug(`Using API path: ${currentApiBasePath}`)

  function buildApiPath(endpoint: string): string {
    const result = (() => {
      if (currentApiBasePath === FALLBACK_API_BASE_PATH) {
        // Special mapping for webrest endpoints
        if (endpoint === '/login') {
          return `${FALLBACK_API_BASE_PATH}/authentication/login`
        }
        if (endpoint === '/logout') {
          return `${FALLBACK_API_BASE_PATH}/authentication/logout`
        }
        // For other endpoints, use webrest format
        return `${FALLBACK_API_BASE_PATH}${endpoint}`
      }
      // Primary API path
      return `${currentApiBasePath}${endpoint}`
    })()

    Log.debug(
      `buildApiPath(${endpoint}) -> ${result} (currentApiBasePath: ${currentApiBasePath})`,
    )
    return result
  }

  function _toHash(username: string, password: string, nonce: string) {
    const token = nonce
      ? hmacSHA1(`${username}:${password}:${nonce}`, password).toString()
      : ''
    return token
  }

  function _joinUrl(url: string) {
    const path = `https://${account!.host}${url}`
    return path
  }

  function _getHeaders(hasAuth = true) {
    if (hasAuth && !account) throw new Error('no token')

    const headers: { 'Content-Type': string; Authorization?: string } = {
      'Content-Type': 'application/json',
    }

    if (hasAuth) {
      if (account!.jwtToken) {
        // JWT Bearer token for /api
        headers.Authorization = `Bearer ${account!.jwtToken}`
      } else if (account!.accessToken) {
        // Hash-based token for /webrest
        headers.Authorization = `${account!.username}:${account!.accessToken}`
      } else {
        throw new Error('No authentication token available')
      }
    }

    return { headers }
  }

  async function _GET(path: string, hasAuth = true): Promise<any> {
    try {
      return await GET(_joinUrl(path), _getHeaders(hasAuth))
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async function _POST(
    path: string,
    data?: object,
    hasAuth = true,
  ): Promise<any> {
    try {
      return await POST(_joinUrl(path), data, _getHeaders(hasAuth))
    } catch (e) {
      // the error carries the request body, with the credentials
      if (
        !path.includes('login') &&
        !path.includes('2fa/verify-otp') &&
        !path.includes('/password')
      )
        console.error(e)
      throw e
    }
  }

  const AstProxy = {
    groups: async () => await _GET(buildApiPath('/astproxy/opgroups')),
    extensions: async (): Promise<ExtensionsType> =>
      await _GET(buildApiPath('/astproxy/extensions')),
    getQueues: async () => await _GET(buildApiPath('/astproxy/queues')),
    // sign the extension in to (or out of) a queue, as a dynamic member
    queueMemberAdd: async (endpointId: string, queueId: string) =>
      await _POST(buildApiPath('/astproxy/queuemember_add'), {
        endpointId,
        queueId,
      }),
    queueMemberRemove: async (endpointId: string, queueId: string) =>
      await _POST(buildApiPath('/astproxy/queuemember_remove'), {
        endpointId,
        queueId,
      }),
    // an empty reason is a generic break, as in NethVoice CTI
    queueMemberPause: async (
      endpointId: string,
      queueId: string,
      reason: string,
    ) =>
      await _POST(buildApiPath('/astproxy/queuemember_pause'), {
        endpointId,
        queueId,
        ...(reason ? { reason } : {}),
      }),
    queueMemberUnpause: async (endpointId: string, queueId: string) =>
      await _POST(buildApiPath('/astproxy/queuemember_unpause'), {
        endpointId,
        queueId,
      }),
    getParkings: async () => await _GET(buildApiPath('/astproxy/parkings')),
    pickupParking: async (parkInformation: any) =>
      await _POST(buildApiPath('/astproxy/pickup_parking'), parkInformation),
    featureCodes: async () =>
      await _GET(buildApiPath('/astproxy/feature_codes')),
  }

  const Authentication = {
    login: async (
      host: string,
      username: string,
      password: string,
    ): Promise<Account> => {
      const data = {
        username,
        password,
      }
      account = {
        host,
        username,
        theme: 'system',
      }
      // Always probe the middleware first, whatever the previous session used
      currentApiBasePath = PRIMARY_API_BASE_PATH

      // Try JWT authentication first (for /api)
      if (currentApiBasePath === PRIMARY_API_BASE_PATH) {
        try {
          const response = await _POST(buildApiPath('/login'), data, false)

          if (response.token) {
            // JWT authentication successful
            account = {
              ...account,
              jwtToken: response.token,
              lastAccess: moment().toISOString(),
              apiBasePath: PRIMARY_API_BASE_PATH,
            } as Account

            // Check if 2FA is required
            if (requires2FA(response.token)) {
              // Return account with JWT token but mark as requiring 2FA
              return account
            } else {
              // Complete login process
              const me = await User.me()
              account.data = me
              const nethlinkExtension = account.data!.endpoints.extension.find(
                (el) => el.type === 'nethlink',
              )
              if (!nethlinkExtension) {
                throw new Error('User not authorized for NethLink')
              }
              return account
            }
          } else {
            throw new Error('No token received')
          }
        } catch (reason: any) {
          // No middleware on this PBX (/api/login itself answered 404, no
          // token yet): use the legacy /webrest login. Network errors and
          // other statuses never switch the path.
          if (reason.response?.status === 404 && !account?.jwtToken) {
            Log.info('No /api/login on this PBX, using /webrest')
            currentApiBasePath = FALLBACK_API_BASE_PATH
          } else {
            // Handle other specific error cases
            if (
              reason.response?.status === 401 &&
              reason.response?.data?.message === 'password_expired'
            ) {
              // right credentials, but the password must be changed first:
              // the policy of the new password comes along
              const expiredError: any = new Error('Password expired')
              expiredError.policy = reason.response?.data?.data?.policy || null
              throw expiredError
            } else if (reason.response?.status === 401) {
              throw new Error('Wrong username or password')
            } else if (reason.response?.status === 404) {
              throw new Error('Network connection lost')
            } else if (reason.message === 'User not authorized for NethLink') {
              throw reason
            } else {
              console.error('Login error:', reason)
              throw new Error('Unauthorized')
            }
          }
        }
      }

      // Hash-based authentication for /webrest (either direct or after fallback)
      if (currentApiBasePath === FALLBACK_API_BASE_PATH) {
        // Hash-based authentication for /webrest
        return new Promise((resolve, reject) => {
          _POST(buildApiPath('/login'), data, false).catch(async (reason) => {
            try {
              if (
                reason.response?.status === 401 &&
                reason.response?.headers['www-authenticate']
              ) {
                const digest = reason.response.headers['www-authenticate']
                const nonce = digest.split(' ')[1]
                if (nonce) {
                  const accessToken = _toHash(username, password, nonce)
                  account = {
                    ...account,
                    accessToken,
                    lastAccess: moment().toISOString(),
                    apiBasePath: FALLBACK_API_BASE_PATH,
                  } as Account
                  const me = await User.me()
                  account.data = me
                  const nethlinkExtension =
                    account.data!.endpoints.extension.find(
                      (el) => el.type === 'nethlink',
                    )
                  if (!nethlinkExtension) {
                    reject(new Error('User not authorized for NethLink'))
                  } else {
                    resolve(account)
                  }
                } else {
                  console.error('undefined nonce response')
                  reject(new Error('Unauthorized'))
                }
              } else {
                console.error('Login error:', reason)
                reject(new Error('Unauthorized'))
              }
            } catch (e) {
              reject(e)
            }
          })
        })
      }

      // This should never be reached
      throw new Error('No authentication method available')
    },

    // Change an expired password: there is no session yet, the current
    // password authenticates the request. Rejects with the middleware
    // error message, e.g. "error_password_length".
    changeExpiredPassword: async (
      host: string,
      username: string,
      currentPassword: string,
      newPassword: string,
    ): Promise<void> => {
      account = { host, username, theme: 'system' } as Account
      try {
        await _POST(
          `${PRIMARY_API_BASE_PATH}/password/change`,
          {
            username,
            current_password: currentPassword,
            new_password: newPassword,
          },
          false,
        )
      } catch (reason: any) {
        throw new Error(reason.response?.data?.message || 'error_unknown')
      }
    },

    // Complete a Single Sign-On login: the JWT was already minted through the
    // host SSO flow (see SSO_LOGIN in the main process), no password involved.
    ssoLogin: async (
      host: string,
      token: string,
      method: AuthenticationMethod = 'saml2',
    ): Promise<Account> => {
      const payload = decodeJWT(token)
      const username = (payload?.username || payload?.id || '')
        .toString()
        .toLowerCase()
      if (!username) {
        throw new Error('Unauthorized')
      }
      currentApiBasePath = PRIMARY_API_BASE_PATH
      account = {
        host,
        username,
        theme: 'system',
        jwtToken: token,
        lastAccess: moment().toISOString(),
        apiBasePath: PRIMARY_API_BASE_PATH,
        authenticationMethod: method,
      } as Account
      const me = await User.me()
      account.data = me
      const nethlinkExtension = account.data!.endpoints.extension.find(
        (el) => el.type === 'nethlink',
      )
      if (!nethlinkExtension) {
        throw new Error('User not authorized for NethLink')
      }
      return account
    },

    verify2FA: async (
      otp: string,
      tempAccount: Account | undefined,
    ): Promise<Account> => {
      account = tempAccount

      if (!account || !account.jwtToken) {
        throw new Error('No active login session')
      }

      try {
        const response = await _POST(
          buildApiPath('/2fa/verify-otp'),
          {
            otp,
            username: account.username,
          },
          true,
        )

        if (response.data.token) {
          // Update account with new JWT token
          account = {
            ...account,
            jwtToken: response.data.token,
            lastAccess: moment().toISOString(),
          } as Account

          // Complete login process
          const me = await User.me()
          account.data = me
          const nethlinkExtension = account.data!.endpoints.extension.find(
            (el) => el.type === 'nethlink',
          )
          if (!nethlinkExtension) {
            // Clean up backend token and clear account state
            try {
              await Authentication.logout()
            } catch (logoutError) {
              Log.warning(
                'Error during logout after unauthorized access:',
                logoutError,
              )
            }
            account = undefined
            throw new Error('User not authorized for NethLink')
          }
          return account
        } else {
          throw new Error('No token received after 2FA verification')
        }
      } catch (reason: any) {
        if (reason.response?.status === 400) {
          throw new Error('OTP invalid')
        } else if (reason.message === 'User not authorized for NethLink') {
          throw reason
        } else {
          console.error('2FA verification error:', reason)
          throw new Error('Verification failed')
        }
      }
    },

    logout: async () => {
      isFirstHeartbeat = false
      try {
        await _POST(buildApiPath('/logout'))
      } catch (e) {
        Log.warning('error during logout:', e)
      } finally {
        // Reset to primary API path for next login attempt
        currentApiBasePath = PRIMARY_API_BASE_PATH
        if (account) {
          account.apiBasePath = PRIMARY_API_BASE_PATH
        }
      }
    },

    // Dedicated token for Phone Island in NethLink (kept separate by design).
    phoneIslandTokenLogin: async (): Promise<{
      username: string
      token: string
    }> => {
      if (currentApiBasePath === FALLBACK_API_BASE_PATH) {
        return await _POST(
          buildApiPath('/authentication/phone_island_token_login'),
          { subtype: 'nethlink' },
        )
      }

      return await POST(
        _joinUrl(buildApiPath('/tokens/persistent/nethlink')),
        undefined,
        _getHeaders(),
      )
    },

    phoneIslandTokenLogout: async (): Promise<void> => {
      if (currentApiBasePath === FALLBACK_API_BASE_PATH) {
        return await _POST(
          buildApiPath('/authentication/persistent_token_remove'),
          { type: 'phone-island', subtype: 'nethlink' },
        )
      }

      return await DELETE(
        _joinUrl(buildApiPath('/tokens/persistent/nethlink')),
        _getHeaders(),
      )
    },
  }

  const HistoryCall = {
    interval: async () => {
      const now = moment()
      const to = now.format('YYYYMMDD')
      const from = now.subtract(2, 'months').format('YYYYMMDD')
      try {
        if (account) {
          const res = await _GET(
            buildApiPath(
              `/historycall/interval/user/${account.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`,
            ),
          )
          return res
        } else {
          throw new Error('no account')
        }
      } catch (e) {
        console.error(e)
        throw e
      }
    },
  }

  const Phonebook = {
    search: async (
      search: string,
      offset = 0,
      pageSize = 10,
      view: 'all' | 'company' | 'person' = 'all',
      visibility = 'all',
      sort = 'displayname',
    ) => {
      const s = await _GET(
        buildApiPath(
          `/phonebook/search/${search.trim()}?offset=${offset}&limit=${pageSize}&view=${view}&visibility=${visibility}&sort=${sort}`,
        ),
      )
      return s
    },
    getSpeeddials: async () => {
      return await _GET(buildApiPath('/phonebook/speeddials'))
    },
    /// SPEEDDIALS
    createSpeeddial: async (create: NewContactType) => {
      const newSpeedDial: NewContactType = {
        name: create.name!,
        privacy: 'private',
        favorite: true,
        selectedPrefNum: 'extension',
        setInput: '',
        type: 'speeddial',
        speeddial_num: create.speeddial_num,
        notes: SpeeddialTypes.BASIC,
      }
      try {
        await _POST(buildApiPath('/phonebook/create'), newSpeedDial)
        return newSpeedDial
      } catch (e) {
        Log.warning('error during createSpeeddial', e)
      }
    },
    createFavourite: async (create: BaseAccountData) => {
      const newSpeedDial: NewContactType = {
        name: create.username, // username
        company: create.name, // veronome
        privacy: 'private',
        favorite: true,
        selectedPrefNum: 'extension',
        setInput: '',
        type: 'speeddial',
        speeddial_num: create.endpoints.mainextension[0].id,
        notes: SpeeddialTypes.FAVOURITES,
      }
      try {
        await _POST(buildApiPath('/phonebook/create'), newSpeedDial)
        return newSpeedDial
      } catch (e) {
        Log.warning('error during createFavourite', e)
      }
    },
    updateSpeeddial: async (edit: NewSpeedDialType, current: ContactType) => {
      if (current.name && current.speeddial_num) {
        const editedSpeedDial = Object.assign({}, current)
        editedSpeedDial.speeddial_num = edit.speeddial_num
        editedSpeedDial.name = edit.name
        editedSpeedDial.id = editedSpeedDial.id?.toString()
        await _POST(
          `${currentApiBasePath}/phonebook/modify_cticontact`,
          editedSpeedDial,
        )
        return editedSpeedDial
      }
    },
    deleteSpeeddial: async (obj: { id: string }) => {
      await _POST(buildApiPath('/phonebook/delete_cticontact'), {
        id: '' + obj.id,
      })
      return obj
    },
    // CONTACTS
    createContact: async (create: ContactType) => {
      const sharedGroups = normalizeSharedGroups(create.shared_groups)

      if (create.privacy === 'group' && sharedGroups.length === 0) {
        throw new Error('Cannot create group contact without shared groups')
      }

      const visibilityType =
        create.privacy === 'group'
          ? serializeSharedGroups(sharedGroups)
          : create.privacy || 'public'

      const newContact: ContactType = {
        type: visibilityType,
        source: 'cti',
        ...(sharedGroups.length > 0 ? { shared_groups: sharedGroups } : {}),
        favorite: false,
        selectedPrefNum: 'extension',
        name: create.name,
        firstname: create.firstname,
        lastname: create.lastname,
        job: create.job,
        company: create.company,
        extension: create.extension,
        workphone: create.workphone,
        workphone2: create.workphone2,
        cellphone: create.cellphone,
        cellphone2: create.cellphone2,
        otherphone: create.otherphone,
        fax: create.fax,
        homephone: create.homephone,
        workemail: create.workemail,
        otheremail: create.otheremail,
        homeemail: create.homeemail,
        facebook: create.facebook,
        instagram: create.instagram,
        linkedin: create.linkedin,
        workstreet: create.workstreet,
        workcity: create.workcity,
        workprovince: create.workprovince,
        workpostalcode: create.workpostalcode,
        workcountry: create.workcountry,
        url: create.url,
        notes: create.notes,
        kind: 'person',
      }
      await _POST(`${currentApiBasePath}/phonebook/create`, newContact)
      return newContact
    },
  }

  const User = {
    me: async (): Promise<AccountData> => {
      const data: AccountData = await _GET(buildApiPath('/user/me'))
      data.mainextension = data!.endpoints.mainextension[0].id
      const ext = data.endpoints.extension.find((e) => e.type === 'nethlink')
      // the !loggedAccount flag allow to reduce the invocation only to the backend module and only at the first login
      if (ext && !loggedAccount && isFirstHeartbeat) {
        isFirstHeartbeat = false
        try {
          const response = await User.heartbeat(ext.id, data.username)
          Log.debug('Sent HEARTBEAT', { response })
        } catch (error) {
          Log.debug('HEARTBEAT skipped: endpoint unavailable', { error })
        }
      }
      return data
    },
    all_avatars: async () => await _GET(buildApiPath('/user/all_avatars')),
    all_endpoints: async () => await _GET(buildApiPath('/user/endpoints/all')),
    heartbeat: async (extension: string, username: string) =>
      await _POST(buildApiPath('/user/nethlink'), {
        extension,
        username,
        ...getNethlinkClientInfo(),
      }),
    settings: async (settings: Partial<AccountData['settings']>) =>
      await _POST(buildApiPath('/user/settings'), settings),
    passwordInfo: async (): Promise<PasswordInfo> =>
      (await _GET(`${PRIMARY_API_BASE_PATH}/password/info`)).data,
    // Rejects with the middleware error message, e.g. "error_password_length"
    changePassword: async (
      currentPassword: string,
      newPassword: string,
    ): Promise<void> => {
      try {
        await _POST(`${PRIMARY_API_BASE_PATH}/user/password`, {
          current_password: currentPassword,
          new_password: newPassword,
        })
      } catch (reason: any) {
        throw new Error(reason.response?.data?.message || 'error_unknown')
      }
    },
    default_device: async (
      deviceIdInformation: Extension,
      force = false,
    ): Promise<boolean> => {
      try {
        if (account?.data?.default_device.type !== 'physical' || force) {
          await _POST(buildApiPath('/user/default_device'), {
            id: deviceIdInformation.id,
          })
          return true
        }
      } catch (e) {
        Log.error(e)
      }
      return false
    },
    setPresence: async (status: StatusTypes, to?: string) =>
      await _POST(buildApiPath('/user/presence'), {
        status,
        ...(to ? { to } : {}),
      }),
  }

  const fetchOperators = async (): Promise<OperatorData> => {
    const endpoints: OperatorsType = await User.all_endpoints() // all devices
    const groups = await AstProxy.groups()
    const extensions = await AstProxy.extensions()
    const avatars = await User.all_avatars()
    return {
      userEndpoints: endpoints,
      operators: endpoints,
      extensions,
      groups,
      avatars,
    }
  }

  const NethVoiceAPI = {
    AstProxy,
    Authentication,
    HistoryCall,
    Phonebook,
    User,
    fetchOperators,
  }

  return {
    NethVoiceAPI,
  }
}
