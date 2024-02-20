import { join } from 'path'
import axios from 'axios'
import crypto from 'crypto'
import moment from 'moment'
import { Account } from '@shared/types'

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

  _getAuthHeader() {
    return {
      Authorization: this._account!.username + ':' + this._account!.accessToken
    }
  }

  AstProxy = {}

  Authentication = {
    login: async (username: string, password: string): Promise<Account> => {
      return new Promise((resolve, reject) => {
        axios
          .post(this._joinUrl('webrest/authentication/login'), {
            username,
            password
          })
          .catch(async (reason) => {
            console.log(reason)
            if (reason.response.status === 401) {
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
          })
      })
    },
    logout: async () => {
      try {
        const res = await axios.post(this._joinUrl('/webrest/authentication/logout'), undefined, {
          headers: {
            ...this._getAuthHeader()
          }
        })
        console.log(res)
        this._account = undefined
        return true
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    phoneIslandTokenLogin: async (): Promise<{ token: string; username: string }> => {
      try {
        const res = await axios.post(
          this._joinUrl('/webrest/authentication/phone_island_token_login'),
          undefined,
          {
            headers: {
              ...this._getAuthHeader()
            }
          }
        )
        return res.data
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    persistantTokenRemove: async () => {
      try {
        const res = await axios.post(
          this._joinUrl('/webrest/authentication/persistent_token_remove'),
          {
            type: 'phone-island'
          },
          {
            headers: {
              ...this._getAuthHeader()
            }
          }
        )
        console.log(res.data)
        return true
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    phoneIslandTokenChack: async () => {
      try {
        const res = await axios.get(
          this._joinUrl('/webrest/authentication/phone_island_token_exists'),
          {
            headers: {
              ...this._getAuthHeader()
            }
          }
        )
        console.log(res.data)
        return true
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  CustCard = {}

  HisCallSwitch = {}

  HistoryCall = {
    interval: async () => {
      const now = moment()
      const to = now.format('YYYYMMDD')
      const from = now.subtract(3, 'months').format('YYYYMMDD')
      try {
        const res = await axios.get(
          this._joinUrl(
            `webrest/historycall/interval/user/${this._account!.username}/${from}/${to}?offset=0&limit=15&sort=time%20desc&removeLostCalls=undefined`
          ),
          {
            headers: {
              ...this._getAuthHeader()
            }
          }
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
    speeddials: async () => {
      try {
        const res = await axios.get(this._joinUrl('/webrest/phonebook/speeddials'), {
          headers: {
            ...this._getAuthHeader()
          }
        })
        return res.data
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  Profiling = {}

  Streaming = {}

  User = {
    me: async () => {
      try {
        const res = await axios.get(this._joinUrl('/webrest/user/me'), {
          headers: {
            ...this._getAuthHeader()
          }
        })
        this._account!.data = res.data
        return this._account!
      } catch (e) {
        console.error(e)
        throw e
      }
    }
  }

  Voicemail = {}

  async searchPhonebook(_search: string) {
    try {
      const res = axios.post(this._joinUrl('/webrest/phonebook/search'), undefined, {
        headers: {
          ...this._getAuthHeader()
        }
      })
      console.log(res)
      return true
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}
