import { useLoggedNethVoiceAPI } from './useLoggedNethVoiceAPI'
import { Account, Extension, PhoneIslandConfig } from '@shared/types'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { eventDispatch } from './eventDispatch'
import { Log } from '@shared/utils/logger'
export const usePhoneIsland = () => {
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const createDataConfig = async (
    account: Account,
  ): Promise<[Extension, string]> => {
    const tokenResponse =
      await NethVoiceAPI.Authentication.phoneIslandTokenLogin()
    const phoneIslandToken = tokenResponse?.token
    if (!phoneIslandToken) {
      throw new Error('Unable to retrieve dedicated Phone Island token')
    }

    const deviceInformationObject: Extension | undefined =
      account.data!.endpoints.extension.find((e) => e.type === 'nethlink')
    if (deviceInformationObject) {
      const hostname = account!.host
      // Phone Island saves the API mode it probed and never probes again:
      // align it with the path decided at login, so a stale 'legacy' mode
      // does not keep it on /webrest and /socket.io
      try {
        localStorage.setItem(
          `phone_island_api_mode_${account.username}`,
          account.jwtToken ? 'new' : 'legacy',
        )
      } catch (e) {
        Log.warning('unable to set the Phone Island API mode', e)
      }
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: phoneIslandToken,
        sipExten: deviceInformationObject.id,
        sipSecret: deviceInformationObject.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || '',
      }
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`,
      )
      return [deviceInformationObject, dataConfig]
    }
    throw new Error('No device information')
  }

  const dispatchAndWait = async (
    event: PHONE_ISLAND_EVENTS,
    awaitEvent: PHONE_ISLAND_EVENTS,
    options?: {
      data?: any
      timeout?: number
    },
  ) => {
    return new Promise<void>((resolve) => {
      const listener = () => {
        Log.debug('D&W received', awaitEvent)
        timer && clearTimeout(timer)
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }
      const timer = setTimeout(() => {
        Log.debug('D&W timeout', event)
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }, options?.timeout || 300)
      Log.debug('D&W add event listener from', event, 'to', awaitEvent)
      window.addEventListener(awaitEvent, listener)
      Log.debug('D&W Disaptch', event)
      eventDispatch(event, options?.data)
    })
  }

  return {
    createDataConfig,
    dispatchAndWait,
  }
}
