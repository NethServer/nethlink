import { IconProp } from "@fortawesome/fontawesome-svg-core"
import {
  NethLinkLogoIcon as DesktopDevice,
} from '@renderer/icons'
import {
  IconDefinition,
  faOfficePhone as PhysicalDevice
} from '@nethesis/nethesis-solid-svg-icons'
import { useSharedState } from "@renderer/store"
import { AvailableDevices, Extension } from "@shared/types"
import { Log } from "@shared/utils/logger"
import { t } from "i18next"
import { OptionElement } from "../OptionElement"
import { debouncer } from "@shared/utils/utils"
import { IPC_EVENTS } from "@shared/constants"

export const DeviceIcons = {
  nethlink: {
    Icon: <DesktopDevice />
  },
  physical: PhysicalDevice
}
type DeviceType = { name: AvailableDevices, label: string, icon?: IconProp | IconDefinition, iconElem?: JSX.Element }
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

  const themeOptions = {
    nethlink: { iconElem: DeviceIcons.nethlink.Icon, label: t('Settings.Desktop Phone') },
    physical: { icon: DeviceIcons.physical, label: t('Settings.IP Phone') },
  }

  if (!account) return <></>
  const nethlink = account.data!.endpoints.extension.find((e) => e.type === 'nethlink')!
  const accountDevices: AvailableDeviceOption[] = account.data?.endpoints.extension.reduce<AvailableDeviceOption[]>((p, d) => {
    Log.info('devices', d)
    if (d.type === 'physical') {
      p.push({
        ...themeOptions.physical,
        name: 'physical',
        label: d.description || themeOptions.physical.label,
        id: d.id,
        ext: d
      } as AvailableDeviceOption)
    }
    return p
  }, [{
    ...themeOptions.nethlink,
    name: 'nethlink',
    id: nethlink?.id,
    ext: nethlink
  }]) || []

  return (
    <div className="py-2">
      {accountDevices.map((availableDevices) => (
        <OptionElement
          key={availableDevices.id}
          icon={availableDevices.icon}
          iconElem={availableDevices.iconElem}
          label={availableDevices.label}
          isSelected={device === availableDevices.name}
          onClick={() => handleSetDevice(availableDevices)}
        />
      ))}
    </div>
  )
}
