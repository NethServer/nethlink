import { PhoneIsland } from "@nethesis/phone-island"
import { eventDispatch } from "@renderer/hooks/eventDispatch"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useSharedState } from "@renderer/store"
import { PHONE_ISLAND_EVENTS } from "@shared/constants"
import { Log } from "@shared/utils/logger"
import { useEffect, useMemo } from "react"

export const PhoneIslandContainer = ({ dataConfig, deviceInformationObject, isDataConfigCreated, i18nLoadPath }) => {
  const [account] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  useEffect(() => {
    updateAccountInfo()
  }, [dataConfig])

  const updateAccountInfo = async () => {
    if (account!.data!.default_device.type !== 'nethlink' && deviceInformationObject) {
      try {
        await NethVoiceAPI.User.default_device(deviceInformationObject)
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-default-device-change'], { deviceInformationObject })
      } catch (err) {
        Log.warning('error during NethVoiceAPI.User.default_device:', err)
      }
    }
  }

  const PhoneIslandComponent = useMemo(() => {
    return dataConfig && isDataConfigCreated && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={i18nLoadPath} uaType='mobile' />
  }, [account?.username, dataConfig, isDataConfigCreated])

  return PhoneIslandComponent
}
