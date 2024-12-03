import { PhoneIsland } from "@nethesis/phone-island"
import { eventDispatch } from "@renderer/hooks/eventDispatch"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useStoreState } from "@renderer/store"
import { PHONE_ISLAND_EVENTS } from "@shared/constants"
import { Account } from "@shared/types"
import { log } from "@shared/utils/logger"
import { useEffect, useMemo } from "react"

export const PhoneIslandContainer = ({ dataConfig, deviceInformationObject, isDataConfigCreated, i18nLoadPath }) => {
  const [account] = useStoreState<Account>('account')
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
        log(err)
      }
    }
  }

  const PhoneIslandComponent = useMemo(() => {
    log('update PhoneIsland', account?.username, isDataConfigCreated, dataConfig)
    return dataConfig && isDataConfigCreated && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={i18nLoadPath} uaType='mobile' />
  }, [account?.username, dataConfig, isDataConfigCreated])

  return PhoneIslandComponent
}
