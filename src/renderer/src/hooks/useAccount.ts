import { AvailableDevices, StatusTypes } from "@shared/types"
import { useCallback, useEffect } from "react"
import { useSharedState } from "@renderer/store"
import { PERMISSION } from "@shared/constants"
import { Log } from "@shared/utils/logger"
import { useLoggedNethVoiceAPI } from "./useLoggedNethVoiceAPI"
import { debouncer } from "@shared/utils/utils"
import { useRefState } from "./useRefState"



export const useAccount = () => {
  const [account, setAccount] = useSharedState('account')
  const [device, setDevice] = useSharedState('device')

  const [status, setStatus] = useSharedState('accountStatus')
  const [isCallsEnabled, setIsCallsEnabled] = useSharedState('isCallsEnabled')
  const [lastDevice] = useRefState(useSharedState('lastDevice'))

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  useEffect(() => {
    debouncer('updateAccountStatus', updateStatus, 500)
  }, [account?.data, device])

  async function updateStatus() {
    Log.info('Update presence status:', account?.data?.mainPresence || status)
    if (account?.data) {
      let _status: StatusTypes = account.data.mainPresence || status
      if (lastDevice.current?.id !== device?.id) {
        lastDevice.current = device
        if (device?.type === 'physical') {
          const devices = await NethVoiceAPI.AstProxy.extensions()
          _status = devices[device.id].status || 'offline'
          Log.debug('update device', device?.id || 'ND', device?.type || 'ND', devices[device?.id || ''].status || 'ND', _status)
        }
      }
      setStatus(() => _status)
      setIsCallsEnabled(() => !(_status === 'busy' || _status === 'ringing' || _status === 'offline'))
    } else {
      setStatus(() => 'offline')
      setIsCallsEnabled(() => false)
    }
  }

  const hasPermission = (permission: PERMISSION) => {
    return account?.data?.profile?.macro_permissions?.settings?.permissions?.[permission]?.value
  }

  const updateAccountData = async () => {
    try {
      const me = await NethVoiceAPI.User.me()
      Log.debug('phone-island-default-device-updated', me.default_device)
      const device = {
        type: me.default_device.type as AvailableDevices,
        id: me.default_device.id
      }
      setDevice(() => device)
      setAccount((p) => ({
        ...p!,
        data: {
          ...p?.data,
          ...me
        }
      }))
    } catch (e) {
      Log.error(e)
      throw e
    }
  }

  return {
    status,
    isCallsEnabled,
    hasPermission,
    updateAccountData
  }

}
