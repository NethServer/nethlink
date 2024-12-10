import { IconProp } from "@fortawesome/fontawesome-svg-core"
import {
  faAdjust as WebDevice,
  faAnchorLock as DesktopDevice,
  faAngleDoubleLeft as PhysicalDevice,
} from '@fortawesome/free-solid-svg-icons'
import { useSharedState } from "@renderer/store"
import { AvailableDevices, Extension } from "@shared/types"
import { Log } from "@shared/utils/logger"
import { t } from "i18next"
import { OptionElement } from "../OptionElement"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { debouncer } from "@shared/utils/utils"
import { IPC_EVENTS } from "@shared/constants"

export const DeviceIcons = {
  nethlink: DesktopDevice,
  webrtc: WebDevice,
  physical: PhysicalDevice
}
type DeviceType = { name: AvailableDevices, label: string, icon: IconProp }
type AvailableDeviceOption = {
  id: string,
  ext: Extension
} & DeviceType
export const DeviceBox = () => {
  const [account] = useSharedState('account')
  const [device, setDevice] = useSharedState('device')
  async function handleSetDevice(newDevice: AvailableDeviceOption) {
    Log.info('change device to', newDevice)
    setDevice(() => newDevice.name)
    debouncer('update-account-default-device', () => {
      //await NethVoiceAPI.User.default_device(newDevice.ext)
      window.electron.send(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, newDevice.ext, true)
      //TODO: lanciare anche l'eventDispatch su phoneIsland
    }, 250)
  }

  const themeOptions: DeviceType[] = [
    { name: 'nethlink', icon: DeviceIcons.nethlink, label: t('Settings.Desktop Phone') },
    { name: 'physical', icon: DeviceIcons.physical, label: t('Settings.IP Phone') },
    { name: 'webrtc', icon: DeviceIcons.webrtc, label: t('Settings.Web Phone') }
  ]

  if (!account) return <></>
  const accountDevices: AvailableDeviceOption[] = account.data?.endpoints.extension.reduce<AvailableDeviceOption[]>((p, d) => {
    const option = themeOptions.find((o) => o.name === d.type)
    Log.info(d)
    if (option) {
      p.push({
        ...option,
        label: d.description || option.label,
        id: d.id,
        ext: d
      } as AvailableDeviceOption)
    }
    return p
  }, []) || []

  return (
    <div className="py-2">
      {accountDevices.map((availableDevices) => (
        <OptionElement
          key={availableDevices.name}
          icon={availableDevices.icon}
          label={availableDevices.label}
          isSelected={device === availableDevices.name}
          onClick={() => handleSetDevice(availableDevices)}
        />
      ))}
    </div>
  )
}
