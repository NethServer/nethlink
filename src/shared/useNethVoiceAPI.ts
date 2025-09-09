
import moment from 'moment'
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

// Base path for API endpoints
const API_BASE_PATH = '/api'

export const useNethVoiceAPI = (loggedAccount: Account | undefined = undefined) => {
  const { GET, POST } = useNetwork()
  let isFirstHeartbeat = true
  let account: Account | undefined = loggedAccount || undefined

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
      // Use JWT Bearer token only
      if (account!.jwtToken) {
        headers.Authorization = `Bearer ${account!.jwtToken}`
      } else {
        throw new Error('No JWT token available for authentication')
      }
    }

    return { headers }
  }

  async function _GET(path: string, hasAuth = true): Promise<any> {
    try {
      return (await GET(_joinUrl(path), _getHeaders(hasAuth)))
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async function _POST(path: string, data?: object, hasAuth = true): Promise<any> {
    try {
      return (await POST(_joinUrl(path), data, _getHeaders(hasAuth)))
    } catch (e) {
      if (!path.includes('login') && !path.includes('2fa/verify-otp'))
        console.error(e)
      throw e
    }
  }

  const AstProxy = {
    groups: async () => await _GET(`${API_BASE_PATH}/astproxy/opgroups`),
    extensions: async (): Promise<ExtensionsType> => await _GET(`${API_BASE_PATH}/astproxy/extensions`),
    getQueues: async () => await _GET(`${API_BASE_PATH}/astproxy/queues`),
    getParkings: async () => await _GET(`${API_BASE_PATH}/astproxy/parkings`),
    pickupParking: async (parkInformation: any) => await _POST(`${API_BASE_PATH}/astproxy/pickup_parking`, parkInformation)
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

      try {
        // Try JWT login
        const response = await _POST(`${API_BASE_PATH}/login`, data, false)

        if (response.token) {
          // JWT authentication successful
          account = {
            ...account,
            jwtToken: response.token,
            lastAccess: moment().toISOString()
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
        // Handle specific error cases
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
    },

    verify2FA: async (otp: string, tempAccount: Account | undefined): Promise<Account> => {
      account = tempAccount

      if (!account || !account.jwtToken) {
        throw new Error('No active login session')
      }

      try {
        const response = await _POST(`${API_BASE_PATH}/2fa/verify-otp`, {
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
          await _POST(`${API_BASE_PATH}/authentication/logout`, {})
        } catch (e) {
          Log.warning("error during logout:", e)
        } finally {
          resolve()
        }
      })
    },

    phoneIslandTokenLogin: async (): Promise<{ username: string, token: string }> =>
      await _POST(`${API_BASE_PATH}/authentication/phone_island_token_login`, { subtype: 'nethlink' }),
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
            `${API_BASE_PATH}/historycall/interval/user/${account.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`
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
        `${API_BASE_PATH}/phonebook/search/${search.trim()}?offset=${offset}&limit=${pageSize}&view=${view}`
      )
      return s
    },
    getSpeeddials: async () => {
      return await _GET(`${API_BASE_PATH}/phonebook/speeddials`)
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
        await _POST(`${API_BASE_PATH}/phonebook/create`, newSpeedDial)
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
        await _POST(`${API_BASE_PATH}/phonebook/create`, newSpeedDial)
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
          await _POST(`${API_BASE_PATH}/phonebook/modify_cticontact`, editedSpeedDial)
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
        await _POST(`${API_BASE_PATH}/phonebook/modify_cticontact`, editedSpeedDial)
        return editedSpeedDial
      }
    },
    deleteSpeeddial: async (obj: { id: string }) => {
      await _POST(`${API_BASE_PATH}/phonebook/delete_cticontact`, { id: '' + obj.id })
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
      await _POST(`${API_BASE_PATH}/phonebook/create`, newContact)
      return newContact
    },
    updateContact: async (edit: NewContactType, current: ContactType) => {
      if (current.name && current.speeddial_num) {
        const newSpeedDial = Object.assign({}, current)
        newSpeedDial.speeddial_num = edit.speeddial_num
        newSpeedDial.name = edit.name
        newSpeedDial.id = newSpeedDial.id?.toString()
        await _POST(`${API_BASE_PATH}/phonebook/modify_cticontact`, newSpeedDial)
        return current
      }
    },
    deleteContact: async (obj: { id: string }) => {
      await _POST(`${API_BASE_PATH}/phonebook/delete_cticontact`, obj)
    }
  }

  const Profiling = {
    all: async () => {
      return await _GET(`${API_BASE_PATH}/profiling/all`)
    }
  }

  const Streaming = {}

  const User = {
    me: async (): Promise<AccountData> => {
      const data: AccountData = await _GET(`${API_BASE_PATH}/user/me`)
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
    all: async () => await _GET(`${API_BASE_PATH}/user/all`),
    all_avatars: async () => await _GET(`${API_BASE_PATH}/user/all_avatars`),
    all_endpoints: async () => await _GET(`${API_BASE_PATH}/user/endpoints/all`),
    heartbeat: async (extension: string, username: string) => await _POST(`${API_BASE_PATH}/user/nethlink`, { extension, username }),
    default_device: async (deviceIdInformation: Extension, force = false): Promise<boolean> => {
      try {
        if (account?.data?.default_device.type !== 'physical' || force) {
          await _POST(`${API_BASE_PATH}/user/default_device`, { id: deviceIdInformation.id })
          return true
        }
      } catch (e) {
        Log.error(e)
      }
      return false;
    },
    setPresence: async (status: StatusTypes, to?: string) => await _POST(`${API_BASE_PATH}/user/presence`, { status, ...(to ? { to } : {}) })
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
