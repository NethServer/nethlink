import { Log } from '@shared/utils/logger';
import axios, { AxiosError } from 'axios'
export class NetworkController {
  static instance: NetworkController
  constructor() {
    NetworkController.instance = this
  }

  async post(path: string, data: object | undefined, config: { headers: { Authorization?: string | undefined; 'Content-Type': string; }; } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      const response = await axios.post(path, data, {
        timeout: 5000,
        ...config
      })

      return response.data
    } catch (e: any) {
      const err: AxiosError = e
      Log.error('during fetch POST', err.name, err.code, err.message, path, config, data)
      throw e
    }
  }
  async get(path: string, config: { headers: { Authorization?: string | undefined; 'Content-Type': string } } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      const response = await axios.get(path, {
        timeout: 5000,
        ...config
      })
      return response.data
    } catch (e: any) {
      const err: AxiosError = e
      Log.error('during fetch GET', err.name, err.code, err.message, path, config)
      throw e
    }
  }

  async head(path: string, timeoutMs: number = 5000): Promise<boolean> {
    try {
      await axios.head(path, {
        timeout: timeoutMs
      })
      return true
    } catch (e: any) {
      const err: AxiosError = e
      Log.debug('during fetch HEAD', err.name, err.code, err.message, path)
      return false
    }
  }

}
