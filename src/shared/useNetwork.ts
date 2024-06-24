import { log } from "@shared/utils/logger";
import axios, { AxiosError } from "axios";

export const useNetwork = () => {

  async function POST(path: string, data: object | undefined, config: { headers: { Authorization?: string | undefined; 'Content-Type': string; }; } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      const response = await axios.post(path, data, config)

      return response.data
    } catch (e: any) {
      const err: AxiosError = e
      if (!path.includes('login'))
        log(err.name, err.code, err.message, path, config, data)
      throw e
    }
  }
  async function GET(path: string, config: { headers: { Authorization?: string | undefined; 'Content-Type': string } } | undefined = { headers: { 'Content-Type': 'application/json' } }): Promise<any> {
    try {
      const response = await axios.get(path, config)
      return response.data
    } catch (e: any) {
      const err: AxiosError = e

      log(err.name, err.code, err.message, path, config)
      throw e
    }
  }

  return {
    GET,
    POST
  }
}
