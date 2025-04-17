import { IconProp } from "@fortawesome/fontawesome-svg-core"
import {
  NethLinkLogoIcon as DesktopDevice,
} from '@renderer/icons'
import {
  IconDefinition,
  faOfficePhone as PhysicalDevice
} from '@nethesis/nethesis-solid-svg-icons'
import { useSharedState } from "@renderer/store"
import { AvailableDevices, Extension, ExtensionsType, StatusTypes } from "@shared/types"
import { Log } from "@shared/utils/logger"
import { t } from "i18next"
import { OptionElement } from "../OptionElement"
import { debouncer } from "@shared/utils/utils"
import { IPC_EVENTS } from "@shared/constants"
import { useEffect, useState } from "react"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"

export const DeviceIcons = {
  nethlink: {
    Icon: <DesktopDevice />
  },
  webrtc: {
    Icon: <DesktopDevice />
  },
  physical: PhysicalDevice
}
type DeviceType = { name: AvailableDevices, label: string, icon?: IconProp | IconDefinition, iconElem?: JSX.Element }
type AvailableDeviceOption = {
  id: string,
  status: StatusTypes
  ext: Extension
} & DeviceType
export const DeviceBox = () => {
  const [account] = useSharedState('account')
  const [device, setDevice] = useSharedState('device')
  const [devicesStatus, setDevicesStatus] = useState<ExtensionsType>({})
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  useEffect(() => {
    NethVoiceAPI.AstProxy.extensions().then((devices: ExtensionsType) => {
      setDevicesStatus(() => ({ ...devices }))
    })
  }, [])


  async function handleSetDevice(newDevice: AvailableDeviceOption) {
    Log.info('change device to', newDevice)
    setDevice(() => ({
      id: newDevice.id,
      type: newDevice.name,
      status: newDevice.status
    }))
    debouncer('update-account-default-device', () => {
      window.electron.send(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, newDevice.ext, true)
    }, 250)
  }

  const themeOptions = {
    nethlink: { iconElem: DeviceIcons.nethlink.Icon, label: t('Settings.Only nethlink') },
    physical: { icon: DeviceIcons.physical, label: t('Settings.IP Phone') },
  }

  if (!account) return <></>
  const nethlink = account.data!.endpoints.extension.find((e) => e.type === 'nethlink')!
  const accountDevices: AvailableDeviceOption[] = account.data?.endpoints.extension.reduce<AvailableDeviceOption[]>((p, d) => {
    if (d.type === 'physical') {
      const status = devicesStatus[d.id]?.status
      const isOffline = status !== 'online'
      p.push({
        ...themeOptions.physical,
        name: 'physical',
        label: `${d.description || themeOptions.physical.label} ${isOffline ? '(offline)' : ''}`,
        status,
        id: d.id,
        ext: d
      } as AvailableDeviceOption)
    }
    return p
  }, [{
    ...themeOptions.nethlink,
    status: 'online',
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
          isSelected={device?.id === availableDevices.id}
          onClick={() => handleSetDevice(availableDevices)}
        />
      ))}
    </div>
  )
}
