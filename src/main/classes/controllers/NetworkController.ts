import axios from 'axios'
export class NetworkController {
  static instance: NetworkController
  constructor() {
    NetworkController.instance = this
  }
  async post(path: string, data: object | undefined, config: { headers: { Authorization?: string | undefined; 'Content-Type': string; }; } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      return (await axios.post(path, data, config)).data
    } catch (e) {
      console.error(e)
      throw e
    }
  }
  async get(path: string, config: { headers: { Authorization?: string | undefined; 'Content-Type': string } } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      return (await axios.get(path, config)).data
    } catch (e) {
      console.error(e)
      throw e
    }
  }

}
