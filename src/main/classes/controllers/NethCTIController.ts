import crypto from 'crypto'
import moment from 'moment'
import { Account, NewContactType, OperatorData, ContactType, NewSpeedDialType, Extension, StatusTypes, OperatorsType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { NetworkController } from './NetworkController'
import { AccountController } from './AccountController'

export class NethVoiceAPI {
  _host: string
  _account: Account | undefined
  constructor(host: string, account?: Account | undefined) {
    this._host = host
    this._account = account
  }

  static api = () => {
    const account = AccountController.instance.getLoggedAccount()
    const api = new NethVoiceAPI(account!.host, account)
    log('get API', account?.username, account?.host)
    return api
  }

  _joinUrl(url: string) {
    const host = this._host
    const path = `${host}${url}`
    return path
  }

  _toHash(username: string, password: string, nonce: string) {
    const tohash = username + ':' + password + ':' + nonce
    const encoder = new TextEncoder()
    const data = encoder.encode(tohash)
    const hmac = crypto.createHmac('sha1', password)
    hmac.update(data)
    return hmac.digest('hex')
  }

  _getHeaders(hasAuth = true) {
    if (hasAuth && !this._account)
      throw new Error('no token')
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(hasAuth && { Authorization: this._account!.username + ':' + this._account!.accessToken })
      }
    }
  }

  async _GET(path: string, hasAuth = true): Promise<any> {
    try {
      return (await NetworkController.instance.get(this._joinUrl(path), this._getHeaders(hasAuth)))
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async _POST(path: string, data?: object, hasAuth = true): Promise<any> {
    try {
      return (await NetworkController.instance.post(this._joinUrl(path), data, this._getHeaders(hasAuth)))
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  AstProxy = {
    groups: async () => await this._GET('/webrest/astproxy/opgroups'),
    extensions: async () => await this._GET('/webrest/astproxy/extensions'),
    queues: async () => await this._GET('/webrest/astproxy/queues')
  }


  Authentication = {
    login: async (username: string, password: string): Promise<Account> => {
      const data = {
        username,
        password
      }
      return new Promise((resolve, reject) => {
        this._POST('/webrest/authentication/login', data, false).catch(async (reason) => {
          try {
            if (reason.response?.status === 401 && reason.response?.headers['www-authenticate']) {
              const digest = reason.response.headers['www-authenticate']
              const nonce = digest.split(' ')[1]
              if (nonce) {
                const accessToken = this._toHash(username, password, nonce)
                this._account = {
                  host: this._host,
                  username,
                  accessToken,
                  theme: 'system',
                  lastAccess: moment().toISOString()
                }
                const me = await this.User.me()
                const nethlinkExtension = me!.data!.endpoints.extension.find((el) => el.type === 'nethlink')
                if (!nethlinkExtension)
                  reject(new Error("Questo utente non è abilitato all'uso del NethLink"))
                else {
                  //importo il file config di questo host per prelevare le informazioni su SIP_host e port solo se sono su demo-leopard devo prenderli statici
                  let SIP_HOST = '127.0.0.1'
                  let SIP_PORT = '5060'
                  let NUMERIC_TIMEZONE = '+0200'
                  let TIMEZONE = 'Europe/Rome'

                  if (this._account.host.includes('demo-leopard')) {
                    SIP_PORT = '5060'
                  } else if (this._account.host.includes('nethvoice')) {
                    SIP_PORT = '20139'
                  } else {
                    const res = await this._GET('/config/config.production.js')
                    log(res)
                    SIP_HOST = res.split("SIP_HOST: '")[1].split("',")[0].trim() //
                    SIP_PORT = res.split("SIP_PORT: '")[1].split("',")[0].trim() //
                    NUMERIC_TIMEZONE = res.split("NUMERIC_TIMEZONE: '")[1].split("',")[0].trim() //
                    TIMEZONE = res.split(" TIMEZONE: '")[1].split("',")[0].trim() //
                  }

                  this._account.sipHost = SIP_HOST
                  this._account.sipPort = SIP_PORT
                  this._account.numeric_timezone = NUMERIC_TIMEZONE
                  this._account.timezone = TIMEZONE
                  log(this._account)
                  resolve(this._account)
                }
              }
            } else {
              console.error('undefined nonce response')
              reject(new Error('Unauthorized'))
            }
          } catch (e) {
            reject(e)
          }
        })
      })
    },
    logout: async () => {
      return new Promise<void>(async (resolve) => {
        try {
          await this._POST('/webrest/authentication/logout', {})
        } catch (e) {
          log("ERROR on logout", e)
        } finally {
          this._account = undefined
          resolve()
        }
      })
    },
    phoneIslandTokenLogin: async () =>
      await this._POST('/webrest/authentication/phone_island_token_login'),
    // persistantTokenRemove: async () =>
    //   await this._POST('/webrest/authentication/persistent_token_remove', {
    //     type: 'phone-island'
    //   }),
    // phoneIslandTokenChack: async () =>
    //   await this._GET('/webrest/authentication/phone_island_token_exists')
  }

  CustCard = {}

  HisCallSwitch = {}

  HistoryCall = {
    interval: async () => {
      const now = moment()
      const to = now.format('YYYYMMDD')
      const from = now.subtract(2, 'months').format('YYYYMMDD')
      try {
        if (this._account) {
          const res = await this._GET(
            `/webrest/historycall/interval/user/${this._account.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`
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

  OffHour = {}

  Phonebook = {
    search: async (
      search: string,
      offset = 0,
      pageSize = 10,
      view: 'all' | 'company' | 'person' = 'all'
    ) => {
      const s = await this._GET(
        `/webrest/phonebook/search/${search.trim()}?offset=${offset}&limit=${pageSize}&view=${view}`
      )
      return s
    },
    speeddials: async () => {
      return await this._GET('/webrest/phonebook/speeddials')
    },
    ///SPEEDDIALS
    createSpeeddial: async (create: NewContactType) => {
      const newSpeedDial: NewContactType = {
        name: create.name,
        privacy: 'private',
        favorite: true,
        selectedPrefNum: 'extension',
        setInput: '',
        type: 'speeddial',
        speeddial_num: create.speeddial_num
      }
      await this._POST(`/webrest/phonebook/create`, newSpeedDial)
      return newSpeedDial
    },
    updateSpeeddial: async (edit: NewSpeedDialType, current: ContactType) => {
      //log(edit)

      if (current.name && current.speeddial_num) {
        const editedSpeedDial = Object.assign({}, current)
        editedSpeedDial.speeddial_num = edit.speeddial_num
        editedSpeedDial.name = edit.name
        editedSpeedDial.id = editedSpeedDial.id?.toString()
        //log('Edited speedDial', editedSpeedDial, current)
        await this._POST(`/webrest/phonebook/modify_cticontact`, editedSpeedDial)
        return editedSpeedDial
      }
    },
    deleteSpeeddial: async (obj: { id: string }) => {
      await this._POST(`/webrest/phonebook/delete_cticontact`, { id: '' + obj.id })
      return obj
    },
    ///CONTACTS
    //PROVA A METTERE IL CONTACTTYPE E NON IL NEWCONTACTTYPE
    createContact: async (create: ContactType) => {
      //L"API VUOLE IL PARAMETRO setInput
      const newContact: ContactType /* & { setInput: string } */ = {
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
        //setInput: ''
      }
      //console.log("DATA: ", newContact)
      await this._POST(`/webrest/phonebook/create`, newContact)
      return newContact
    },
    updateContact: async (edit: NewContactType, current: ContactType) => {
      if (current.name && current.speeddial_num) {
        const newSpeedDial = Object.assign({}, current)
        newSpeedDial.speeddial_num = edit.speeddial_num
        newSpeedDial.name = edit.name
        newSpeedDial.id = newSpeedDial.id?.toString()
        await this._POST(`/webrest/phonebook/modify_cticontact`, newSpeedDial)
        return current
      }
    },
    deleteContact: async (obj: { id: string }) => {
      await this._POST(`/webrest/phonebook/delete_cticontact`, obj)
    }
  }

  Profiling = {
    all: async () => {
      return await this._GET(`/webrest/profiling/all`)
    }
  }

  Streaming = {}

  User = {
    me: async () => {
      this._account!.data = await this._GET('/webrest/user/me')
      return this._account!
    },
    all: async () => await this._GET('/webrest/user/all'),
    all_avatars: async () => await this._GET('/webrest/user/all_avatars'),
    all_endpoints: async () => await this._GET('/webrest/user/endpoints/all'),
    heartbeat: async (extension: string) => await this._POST('/webrest/user/nethlink', { extension }),
    default_device: async (deviceIdInformation: Extension) => await this._POST('/webrest/user/default_device', { id: deviceIdInformation.id }),
    setPresence: async (status: StatusTypes) => await this._POST('/webrest/user/presence', { status })
    //all_avatars: () => this._GET('/webrest/user/all_avatars'),
  }

  Voicemail = {}

  fetchOperators = async (): Promise<OperatorData> => {
    const endpoints: OperatorsType = await this.User.all_endpoints() //tutti i dispositivi
    const groups = await this.AstProxy.groups() //
    const extensions = await this.AstProxy.extensions()
    const avatars = await this.User.all_avatars()
    return {
      userEndpoints: endpoints, //posso rimuoverlo
      operators: endpoints,
      extensions,
      groups,
      avatars
    }
  }
}
