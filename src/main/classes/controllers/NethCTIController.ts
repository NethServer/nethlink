import { join } from 'path'
import axios from 'axios'
import crypto from 'crypto'
import moment from 'moment'
import { Account, NewContactType, OperatorData, ContactType, NewSpeedDialType } from '@shared/types'

export class NethVoiceAPI {
  _host: string
  _account: Account | undefined
  static instance: NethVoiceAPI
  constructor(host: string, account?: Account | undefined) {
    this._host = host
    this._account = account
    NethVoiceAPI.instance = this
  }

  _joinUrl(url: string) {
    //TODO: modifica forzatura (in questo momento serve per far collegare a phone island)
    //'https://nethvoice.nethesis.it' //'https://cti.demo-heron.sf.nethserver.net' //
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

  _getHeaders(unauthorized = false) {
    return {
      headers: {
        'Content-Type': 'application/json',
        ...(unauthorized
          ? {}
          : { Authorization: this._account!.username + ':' + this._account!.accessToken })
      }
    }
  }

  async _GET(path: string, unauthorized = false): Promise<any> {
    try {
      return (await axios.get(this._joinUrl(path), this._getHeaders(unauthorized))).data
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async _POST(path: string, data?: object, unauthorized = false): Promise<any> {
    try {
      return (await axios.post(this._joinUrl(path), data, this._getHeaders(unauthorized))).data
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  AstProxy = {
    groups: async () => await this._GET('/webrest/astproxy/opgroups'),
    extensions: async () => await this._GET('/webrest/astproxy/extensions')
  }

  Authentication = {
    login: async (username: string, password: string): Promise<Account> => {
      const data = {
        username,
        password
      }
      return new Promise((resolve, reject) => {
        this._POST('/webrest/authentication/login', data, true).catch(async (reason) => {
          try {
            if (reason.response.status === 401 && reason.response.headers['www-authenticate']) {
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
                await this.User.me()
                //importo il file config di questo host per prelevare le informazioni su SIP_host e port
                //TODO: ripristinare
                //const res = await this._GET('/config/config.production.js')
                // const res = (
                //   await axios.get(
                //     'https://cti.demo-heron.sf.nethserver.net/config/config.production.js'
                //   )
                // ).data
                const SIP_HOST = '127.0.0.1' //res.split("SIP_HOST: '")[1].split("',")[0].trim()
                const SIP_PORT = '5060' //res.split("SIP_PORT: '")[1].split("',")[0].trim()
                this._account.sipHost = SIP_HOST
                this._account.sipPort = SIP_PORT
                resolve(this._account)
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
      this._account = undefined
      await this._GET('/webrest/authentication/logout')
    },
    phoneIslandTokenLogin: async () =>
      await this._POST('/webrest/authentication/phone_island_token_login'),
    persistantTokenRemove: async () =>
      await this._POST('/webrest/authentication/persistent_token_remove', {
        type: 'phone-island'
      }),
    phoneIslandTokenChack: async () =>
      await this._GET('/webrest/authentication/phone_island_token_exists')
  }

  CustCard = {}

  HisCallSwitch = {}

  HistoryCall = {
    interval: async () => {
      const now = moment()
      const to = now.format('YYYYMMDD')
      const from = now.subtract(2, 'months').format('YYYYMMDD')
      try {
        const res = await this._GET(
          `/webrest/historycall/interval/user/${this._account!.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`
        )
        return res
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
      pageSize = 15,
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
      console.log(edit)

      if (current.name && current.speeddial_num) {
        const editedSpeedDial = Object.assign({}, current)
        editedSpeedDial.speeddial_num = edit.speeddial_num
        editedSpeedDial.name = edit.name
        editedSpeedDial.id = editedSpeedDial.id?.toString()
        console.log('Edited speedDial', editedSpeedDial, current)
        await this._POST(`/webrest/phonebook/modify_cticontact`, editedSpeedDial)
        return editedSpeedDial
      }
    },
    deleteSpeeddial: async (obj: { id: string }) => {
      await this._POST(`/webrest/phonebook/delete_cticontact`, obj)
    },
    ///CONTACTS
    //PROVA A METTERE IL CONTACTTYPE E NON IL NEWCONTACTTYPE
    createContact: async (create: ContactType) => {
      //L"API VUOLE IL PARAMETRO setInput
      const newContact: ContactType & { setInput: string } = {
        privacy: create.privacy,
        /* DA GUARDARE BENE INSIEME A LOPRE' CON IL CODICE DI LORO SOTTO */
        type: 'speeddial',
        name: create.name,
        company: create.company,
        speeddial_num: create.speeddial_num,
        workphone: create.workphone,
        cellphone: create.cellphone,
        workemail: create.workemail,
        notes: create.notes,
        //DEFAULT VALUES
        favorite: false,
        selectedPrefNum: 'extension',
        setInput: ''
      }
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
    all_endpoints: async () => await this._GET('/webrest/user/endpoints/all')

    //all_avatars: () => this._GET('/webrest/user/all_avatars'),
  }

  Voicemail = {}

  fetchOperators = async (): Promise<OperatorData> => {
    const endpoints = await this.User.all_endpoints() //tutti i dispositivi
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
