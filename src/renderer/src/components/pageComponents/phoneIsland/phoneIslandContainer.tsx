import { PhoneIsland } from "@nethesis/phone-island"
import { useSharedState } from "@renderer/store"
import { IPC_EVENTS } from "@shared/constants"
import { Log } from "@shared/utils/logger"
import { useEffect, useMemo } from "react"

export const PhoneIslandContainer = ({ dataConfig, deviceInformationObject, isDataConfigCreated }) => {
  const [account] = useSharedState('account')

  useEffect(() => {
    updateAccountInfo()
  }, [dataConfig])

  const updateAccountInfo = async () => {
    if (deviceInformationObject) {
      Log.info('FORCE DEFAULT DEVICE TO NETHLINK')
      if (account?.data?.default_device?.type === 'webrtc') {
        window.electron.send(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, deviceInformationObject)
      }
    }
  }

  const PhoneIslandComponent = useMemo(() => {
    return dataConfig && isDataConfigCreated && <PhoneIsland dataConfig={dataConfig} uaType='mobile' />
  }, [account?.username, dataConfig, isDataConfigCreated])

  return PhoneIslandComponent
}
