import { useLoggedNethVoiceAPI } from "./useLoggedNethVoiceAPI"
import { Account, Extension, PhoneIslandConfig } from "@shared/types"
import { log } from "@shared/utils/logger"
import { PHONE_ISLAND_EVENTS } from "@shared/constants"
import { eventDispatch } from "./eventDispatch"
export const usePhoneIsland = () => {

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const createDataConfig = async (account: Account): Promise<[Extension, string]> => {
    const phoneIslandTokenLoginResponse = (await NethVoiceAPI.Authentication.phoneIslandTokenLogin()).token
    const deviceInformationObject: Extension | undefined = account.data!.endpoints.extension.find((e) => e.type === 'nethlink')
    if (deviceInformationObject) {
      log('create data config')
      const hostname = account!.host
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: phoneIslandTokenLoginResponse,
        sipExten: deviceInformationObject.id,
        sipSecret: deviceInformationObject.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || ''
      }
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      return [deviceInformationObject, dataConfig]
    }
    throw new Error('No device information')
  }

  const dispatchAndWait = async (event: PHONE_ISLAND_EVENTS, awaitEvent: PHONE_ISLAND_EVENTS, options?: {
    data?: any,
    timeout?: number
  }) => {
    return new Promise<void>((resolve) => {
      const listener = () => {
        log('received', awaitEvent)
        timer && clearTimeout(timer)
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }
      let timer = setTimeout(() => {
        log('timeout')
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }, options?.timeout || 300)
      log('AddEventListener', awaitEvent)
      window.addEventListener(awaitEvent, listener)
      log('DispatchEvent', event)
      eventDispatch(event, options?.data)
    })
  }


  return {
    createDataConfig,
    dispatchAndWait
  }
}
