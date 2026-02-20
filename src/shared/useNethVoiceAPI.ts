
import moment from 'moment'
import hmacSHA1 from 'crypto-js/hmac-sha1'
import {
  Account,
  NewContactType,
  OperatorData,
  ContactType,
  NewSpeedDialType,
  Extension,
  StatusTypes,
  OperatorsType,
  AccountData,
  BaseAccountData,
  ExtensionsType
} from '@shared/types'
import { Log } from '@shared/utils/logger'
import { useNetwork } from './useNetwork'
import { SpeeddialTypes } from './constants'
import { requires2FA } from '@shared/utils/jwt'

// Base paths for API endpoints (fallback from /api to /webrest)
const PRIMARY_API_BASE_PATH = '/api'
const FALLBACK_API_BASE_PATH = '/webrest'

export const useNethVoiceAPI = (loggedAccount: Account | undefined = undefined) => {
  const { GET, POST, DELETE } = useNetwork()
  let isFirstHeartbeat = true
  let account: Account | undefined = loggedAccount || undefined
  // Use account's stored API path preference, or default to primary
  let currentApiBasePath = account?.apiBasePath || PRIMARY_API_BASE_PATH

  if (account?.apiBasePath) {
    Log.debug(`Using stored API path for ${account.username}: ${account.apiBasePath}`)
  } else {
    Log.debug(`Using default API path: ${PRIMARY_API_BASE_PATH}`)
  }

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

    Log.debug(`buildApiPath(${endpoint}) -> ${result} (currentApiBasePath: ${currentApiBasePath})`)
    return result
  }

  function _toHash(username: string, password: string, nonce: string) {
    const token = nonce ? hmacSHA1(`${username}:${password}:${nonce}`, password).toString() : ''
    return token
  }

  function _joinUrl(url: string) {
    const path = `https://${account!.host}${url}`
    return path
  }

  function _getHeaders(hasAuth = true) {
    if (hasAuth && !account)
      throw new Error('no token')

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
      return (await GET(_joinUrl(path), _getHeaders(hasAuth)))
    } catch (e) {
      // Check if we should try fallback path for critical endpoints
      if (shouldTryFallback(path, e)) {
        return await _GETWithFallback(path, hasAuth)
      }
      console.error(e)
      throw e
    }
  }

  async function _GETWithFallback(path: string, hasAuth = true): Promise<any> {
    const originalPath = path

    // Switch to fallback path and rebuild the correct path
    currentApiBasePath = FALLBACK_API_BASE_PATH
    if (account) {
      account.apiBasePath = FALLBACK_API_BASE_PATH
    }

    // Extract the endpoint from the original path and rebuild with fallback
    const endpoint = path.replace(PRIMARY_API_BASE_PATH, '')
    const fallbackPath = buildApiPath(endpoint)

    try {
      Log.debug(`Trying fallback path: ${fallbackPath}`)
      const result = await GET(_joinUrl(fallbackPath), _getHeaders(hasAuth))

      Log.info('Switched to fallback API path: /webrest')
      return result
    } catch (fallbackError) {
      Log.warning('Fallback also failed:', fallbackError)
      console.error(fallbackError)
      throw fallbackError
    }
  }

  async function _POST(path: string, data?: object, hasAuth = true): Promise<any> {
    try {
      return (await POST(_joinUrl(path), data, _getHeaders(hasAuth)))
    } catch (e) {
      // Check if we should try fallback path for critical endpoints
      if (shouldTryFallback(path, e)) {
        return await _POSTWithFallback(path, data, hasAuth)
      }

      if (!path.includes('login') && !path.includes('2fa/verify-otp'))
        console.error(e)
      throw e
    }
  }

  async function _DELETE(path: string, hasAuth = true): Promise<any> {
    try {
      return (await DELETE(_joinUrl(path), _getHeaders(hasAuth)))
    } catch (e) {
      if (!path.includes('login') && !path.includes('2fa/verify-otp')) {
        console.error(e)
      }
      throw e
    }
  }

  function shouldTryFallback(path: string, error: any): boolean {
    // Only try fallback if we're using primary path
    if (currentApiBasePath !== PRIMARY_API_BASE_PATH) {
      return false
    }

    // Try fallback for connection errors (404, 503, or network failures)
    const isConnectionError = error?.response?.status === 404 || error?.response?.status === 503 || !error?.response

    // For auth endpoints, always try fallback on connection errors
    const isCriticalAuthEndpoint = path.includes('login') || path.includes('2fa/verify-otp')
    if (isCriticalAuthEndpoint && isConnectionError) {
      return true
    }

    // For other endpoints, try fallback only on 404 (endpoint not found)
    // This indicates the API structure is different (middleware vs webrest)
    if (error?.response?.status === 404) {
      return true
    }

    return false
  }

  async function _POSTWithFallback(path: string, data?: object, hasAuth = true): Promise<any> {
    const originalPath = path

    // Switch to fallback path
    currentApiBasePath = FALLBACK_API_BASE_PATH
    if (account) {
      account.apiBasePath = FALLBACK_API_BASE_PATH
    }
    Log.info('Switched to fallback API path: /webrest')

    // For login endpoint, we need special handling for webrest authentication
    if (originalPath.includes('/login')) {
      Log.debug('Login fallback: switching to hash-based authentication')
      // The login function will now use webrest logic since currentApiBasePath is changed
      // We need to throw the original error to let the login function handle the retry
      throw new Error('FALLBACK_TO_WEBREST')
    }

    // For other endpoints, try the direct fallback
    const endpoint = path.replace(PRIMARY_API_BASE_PATH, '')
    const fallbackPath = buildApiPath(endpoint)

    try {
      Log.debug(`Trying fallback path: ${fallbackPath}`)
      const result = await POST(_joinUrl(fallbackPath), data, _getHeaders(hasAuth))
      return result
    } catch (fallbackError) {
      Log.warning('Fallback also failed:', fallbackError)
      if (!originalPath.includes('login') && !originalPath.includes('2fa/verify-otp'))
        console.error(fallbackError)
      throw fallbackError
    }
  }

  const AstProxy = {
    groups: async () => await _GET(buildApiPath('/astproxy/opgroups')),
    extensions: async (): Promise<ExtensionsType> => await _GET(buildApiPath('/astproxy/extensions')),
    getQueues: async () => await _GET(buildApiPath('/astproxy/queues')),
    getParkings: async () => await _GET(buildApiPath('/astproxy/parkings')),
    pickupParking: async (parkInformation: any) => await _POST(buildApiPath('/astproxy/pickup_parking'), parkInformation),
    featureCodes: async () => await _GET(buildApiPath('/astproxy/feature_codes'))
  }


  const Authentication = {
    login: async (host: string, username: string, password: string): Promise<Account> => {
      const data = {
        username,
        password
      }
      account = {
        host,
        username,
        theme: 'system'
      }

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
              apiBasePath: PRIMARY_API_BASE_PATH
            } as Account

            // Check if 2FA is required
            if (requires2FA(response.token)) {
              // Return account with JWT token but mark as requiring 2FA
              return account
            } else {
              // Complete login process
              const me = await User.me()
              account.data = me
              const nethlinkExtension = account.data!.endpoints.extension.find((el) => el.type === 'nethlink')
              if (!nethlinkExtension) {
                throw new Error('User not authorized for NethLink')
              }
              return account
            }
          } else {
            throw new Error('No token received')
          }
        } catch (reason: any) {
          // Check if this is a fallback trigger
          if (reason.message === 'FALLBACK_TO_WEBREST') {
            Log.debug('Retrying login with webrest authentication')
            // Fallback has set currentApiBasePath to FALLBACK_API_BASE_PATH
            // Continue to webrest authentication below
          } else {
            // Handle other specific error cases
            if (reason.response?.status === 401) {
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
              if (reason.response?.status === 401 && reason.response?.headers['www-authenticate']) {
                const digest = reason.response.headers['www-authenticate']
                const nonce = digest.split(' ')[1]
                if (nonce) {
                  const accessToken = _toHash(username, password, nonce)
                  account = {
                    ...account,
                    accessToken,
                    lastAccess: moment().toISOString(),
                    apiBasePath: FALLBACK_API_BASE_PATH
                  } as Account
                  const me = await User.me()
                  account.data = me
                  const nethlinkExtension = account.data!.endpoints.extension.find((el) => el.type === 'nethlink')
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

    verify2FA: async (otp: string, tempAccount: Account | undefined): Promise<Account> => {
      account = tempAccount

      if (!account || !account.jwtToken) {
        throw new Error('No active login session')
      }

      try {
        const response = await _POST(buildApiPath('/2fa/verify-otp'), {
          otp,
          username: account.username
        }, true)

        if (response.data.token) {
          // Update account with new JWT token
          account = {
            ...account,
            jwtToken: response.data.token,
            lastAccess: moment().toISOString()
          } as Account

          // Complete login process
          const me = await User.me()
          account.data = me
          const nethlinkExtension = account.data!.endpoints.extension.find((el) => el.type === 'nethlink')
          if (!nethlinkExtension) {
            // Clean up backend token and clear account state
            try {
              await Authentication.logout()
            } catch (logoutError) {
              Log.warning("Error during logout after unauthorized access:", logoutError)
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
      return new Promise<void>(async (resolve) => {
        try {
          await _POST(buildApiPath('/logout'))
        } catch (e) {
          Log.warning("error during logout:", e)
        } finally {
          // Reset to primary API path for next login attempt
          currentApiBasePath = PRIMARY_API_BASE_PATH
          if (account) {
            account.apiBasePath = PRIMARY_API_BASE_PATH
          }
          resolve()
        }
      })
    },

    // Dedicated token for Phone Island in NethLink (kept separate by design).
    phoneIslandTokenLogin: async (): Promise<{ username: string, token: string }> => {
      try {
        return await _POST(buildApiPath('/tokens/persistent/nethlink'))
      } catch (reason: any) {
        if (reason?.response?.status === 404) {
          // Legacy middleware fallback.
          return await _POST(buildApiPath('/authentication/phone_island_token_login'), { subtype: 'nethlink' })
        }
        throw reason
      }
    },

    phoneIslandTokenLogout: async (): Promise<void> => {
      try {
        return await _DELETE(buildApiPath('/tokens/persistent/nethlink'))
      } catch (reason: any) {
        if (reason?.response?.status === 404) {
          // Legacy middleware fallback.
          return await _POST(buildApiPath('/authentication/persistent_token_remove'), { type: 'phone-island', subtype: 'nethlink' })
        }
        throw reason
      }
    },
  }

  const CustCard = {}

  const HisCallSwitch = {}

  const HistoryCall = {
    interval: async () => {
      const now = moment()
      const to = now.format('YYYYMMDD')
      const from = now.subtract(2, 'months').format('YYYYMMDD')
      try {
        if (account) {
          const res = await _GET(
            buildApiPath(`/historycall/interval/user/${account.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`)
          )
          return res
        } else {
          throw new Error('no account')
        }
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  const OffHour = {}

  const Phonebook = {
    search: async (
      search: string,
      offset = 0,
      pageSize = 10,
      view: 'all' | 'company' | 'person' = 'all'
    ) => {
      const s = await _GET(
        buildApiPath(`/phonebook/search/${search.trim()}?offset=${offset}&limit=${pageSize}&view=${view}`)
      )
      return s
    },
    getSpeeddials: async () => {
      return await _GET(buildApiPath('/phonebook/speeddials'))
    },
    ///SPEEDDIALS
    createSpeeddial: async (create: NewContactType) => {
      const newSpeedDial: NewContactType = {
        name: create.name!,
        privacy: 'private',
        favorite: true,
        selectedPrefNum: 'extension',
        setInput: '',
        type: 'speeddial',
        speeddial_num: create.speeddial_num,
        notes: SpeeddialTypes.BASIC
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
        name: create.username,//username
        company: create.name, //veronome
        privacy: 'private',
        favorite: true,
        selectedPrefNum: 'extension',
        setInput: '',
        type: 'speeddial',
        speeddial_num: create.endpoints.mainextension[0].id,
        notes: SpeeddialTypes.FAVOURITES
      }
      try {
        await _POST(buildApiPath('/phonebook/create'), newSpeedDial)
        return newSpeedDial
      } catch (e) {
        Log.warning('error during createFavourite', e)
      }
    },
    updateSpeeddialBy: async (updatedContact: ContactType) => {
      if (updatedContact.name && updatedContact.speeddial_num) {
        const editedSpeedDial = Object.assign({}, updatedContact)
        editedSpeedDial.id = editedSpeedDial.id?.toString()
        try {
          await _POST(buildApiPath('/phonebook/modify_cticontact'), editedSpeedDial)
          return editedSpeedDial
        } catch (e) {
          Log.warning('error during updateSpeeddialBy', e)
        }
      }
    },
    updateSpeeddial: async (edit: NewSpeedDialType, current: ContactType) => {
      if (current.name && current.speeddial_num) {
        const editedSpeedDial = Object.assign({}, current)
        editedSpeedDial.speeddial_num = edit.speeddial_num
        editedSpeedDial.name = edit.name
        editedSpeedDial.id = editedSpeedDial.id?.toString()
        await _POST(`${currentApiBasePath}/phonebook/modify_cticontact`, editedSpeedDial)
        return editedSpeedDial
      }
    },
    deleteSpeeddial: async (obj: { id: string }) => {
      await _POST(buildApiPath('/phonebook/delete_cticontact'), { id: '' + obj.id })
      return obj
    },
    //CONTACTS
    createContact: async (create: ContactType) => {
      const newContact: ContactType = {
        privacy: create.privacy,
        type: create.privacy,
        name: create.name,
        company: create.company,
        extension: create.extension,
        workphone: create.workphone,
        cellphone: create.cellphone,
        workemail: create.workemail,
        notes: create.notes,
        //DEFAULT VALUES
        favorite: false,
        selectedPrefNum: 'extension',
        kind: 'person'
      }
      await _POST(`${currentApiBasePath}/phonebook/create`, newContact)
      return newContact
    },
    updateContact: async (edit: NewContactType, current: ContactType) => {
      if (current.name && current.speeddial_num) {
        const newSpeedDial = Object.assign({}, current)
        newSpeedDial.speeddial_num = edit.speeddial_num
        newSpeedDial.name = edit.name
        newSpeedDial.id = newSpeedDial.id?.toString()
        await _POST(`${currentApiBasePath}/phonebook/modify_cticontact`, newSpeedDial)
        return current
      }
    },
    deleteContact: async (obj: { id: string }) => {
      await _POST(buildApiPath('/phonebook/delete_cticontact'), obj)
    }
  }

  const Profiling = {
    all: async () => {
      return await _GET(buildApiPath('/profiling/all'))
    }
  }

  const Streaming = {}

  const User = {
    me: async (): Promise<AccountData> => {
      const data: AccountData = await _GET(buildApiPath('/user/me'))
      data.mainextension = data!.endpoints.mainextension[0].id
      const ext = data.endpoints.extension.find((e) => e.type === 'nethlink')
      //the !loggedAccount flag allow to reduce the invocation only to the backend module and only at the first login
      if (ext && !loggedAccount && isFirstHeartbeat) {
        isFirstHeartbeat = false
        const response = await User.heartbeat(ext.id, data.username)
        Log.debug('Sent HEARTBEAT', { response })
      }
      return data
    },
    all: async () => await _GET(buildApiPath('/user/all')),
    all_avatars: async () => await _GET(buildApiPath('/user/all_avatars')),
    all_endpoints: async () => await _GET(buildApiPath('/user/endpoints/all')),
    heartbeat: async (extension: string, username: string) => await _POST(buildApiPath('/user/nethlink'), { extension, username }),
    default_device: async (deviceIdInformation: Extension, force = false): Promise<boolean> => {
      try {
        if (account?.data?.default_device.type !== 'physical' || force) {
          await _POST(buildApiPath('/user/default_device'), { id: deviceIdInformation.id })
          return true
        }
      } catch (e) {
        Log.error(e)
      }
      return false;
    },
    setPresence: async (status: StatusTypes, to?: string) => await _POST(buildApiPath('/user/presence'), { status, ...(to ? { to } : {}) })
  }

  const Voicemail = {}

  const fetchOperators = async (): Promise<OperatorData> => {
    const endpoints: OperatorsType = await User.all_endpoints() //all devices
    const groups = await AstProxy.groups()
    const extensions = await AstProxy.extensions()
    const avatars = await User.all_avatars()
    return {
      userEndpoints: endpoints,
      operators: endpoints,
      extensions,
      groups,
      avatars
    }
  }


  const NethVoiceAPI = {
    AstProxy,
    Authentication,
    CustCard,
    HisCallSwitch,
    HistoryCall,
    OffHour,
    Phonebook,
    Profiling,
    Streaming,
    User,
    Voicemail,
    fetchOperators
  }

  return {
    NethVoiceAPI
  }
}
