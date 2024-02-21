import { join } from 'path'
import axios from 'axios'
import crypto from 'crypto'
import moment from 'moment'
import { Account } from '@shared/types'
import { store } from './StoreController'

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
    console.log('join', this._host)
    return join(this._host, url)
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
      console.log(path)
      return (await axios.post(this._joinUrl(path), data, this._getHeaders(unauthorized))).data
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  AstProxy = {
    groups: async () => await this._GET('webrest/astproxy/opgroups'),
    extensions: async () => await this._GET('webrest/astproxy/extensions')
  }

  Authentication = {
    login: async (username: string, password: string): Promise<Account> => {
      const data = {
        username,
        password
      }
      return new Promise((resolve, reject) => {
        this._POST('webrest/authentication/login', data, true).catch(async (reason) => {
          try {
            console.log(reason)
            if (reason.response.status === 401 && reason.response.headers['www-authenticate']) {
              const digest = reason.response.headers['www-authenticate']
              const nonce = digest.split(' ')[1]
              console.log(digest, nonce)
              if (nonce) {
                const accessToken = this._toHash(username, password, nonce)
                this._account = {
                  host: this._host,
                  username,
                  accessToken,
                  lastAccess: moment().toISOString()
                }
                await this.User.me()
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
      const from = now.subtract(3, 'months').format('YYYYMMDD')
      try {
        const res = await this._GET(
          `webrest/historycall/interval/user/${this._account!.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`
        )
        return res.data
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  OffHour = {}

  Phonebook = {
    search: async (search: string) => {
      return await this._POST('/webrest/phonebook/search')
    },
    speeddials: async () => {
      return await this._GET('/webrest/phonebook/speeddials')
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
      console.log(store.user)
      this._account!.data = await this._GET('/webrest/user/me')
      this.fetchOperators()
      return this._account!
    },
    all: () => this._GET('/webrest/user/all'),
    all_avatars: () => this._GET('/webrest/user/all_avatars'),
    all_endpoints: () => this._GET('/webrest/user/endpoints/all')

    //all_avatars: () => this._GET('/webrest/user/all_avatars'),
  }

  Voicemail = {}

  fetchOperators = async () => {
    const endpoints = await this.User.all_endpoints()
    const groups = await this.AstProxy.groups()
    const extensions = await this.AstProxy.extensions()
    const avatars = await this.User.all_avatars()
    console.log(endpoints, groups, extensions, avatars)
  }
}
