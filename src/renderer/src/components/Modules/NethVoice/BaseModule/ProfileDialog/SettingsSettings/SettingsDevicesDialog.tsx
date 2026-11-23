import { Button } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { parseThemeToClassName } from '@renderer/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMicrophone as AudioInputsIcon,
  faVolumeHigh as AudioOutputsIcon,
  faVideo as VideoInputsIcon,
  faChevronDown as DropdownIcon,
  faCheck as SelectedIcon,
} from '@fortawesome/free-solid-svg-icons'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { DropdownItem } from '@renderer/components/Nethesis/dropdown/DropdownItem'
import { DropdownHeader } from '@renderer/components/Nethesis/dropdown/DropdownHeader'
import { Log } from '@shared/utils/logger'
import { delay } from '@shared/utils/utils'

type DeviceType = 'audioInput' | 'audioOutput' | 'videoInput'
const LOCALSTORAGE_KEYS = {
  audioInput: 'phone-island-audio-input-device',
  audioOutput: 'phone-island-audio-output-device',
  videoInput: 'phone-island-video-input-device',
} as const

const getDeviceFromLocalStorage = (deviceType: DeviceType): string | null => {
  try {
    const rawValue = localStorage.getItem(LOCALSTORAGE_KEYS[deviceType])
    if (!rawValue) return null

    try {
      const parsed = JSON.parse(rawValue)
      return parsed.deviceId || null
    } catch (parseError) {
      console.warn(
        `localStorage value for ${deviceType} is not valid JSON, using raw value:`,
        rawValue,
      )
      return rawValue
    }
  } catch (error) {
    console.warn(`Error reading ${deviceType} from localStorage:`, error)
    return null
  }
}

const setDeviceToLocalStorage = (
  deviceType: DeviceType,
  value: string,
): void => {
  try {
    const jsonValue = JSON.stringify({ deviceId: value })
    localStorage.setItem(LOCALSTORAGE_KEYS[deviceType], jsonValue)
  } catch (error) {
    console.warn(`Error saving ${deviceType} to localStorage:`, error)
  }
}

export function SettingsDeviceDialog() {
  const [account, setAccount] = useSharedState('account')
  const [, setIsDeviceDialogOpen] = useNethlinkData('isDeviceDialogOpen')
  const [theme] = useSharedState('theme')
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const [devices, setDevices] = useState<{
    audioInput: MediaDeviceInfo[]
    audioOutput: MediaDeviceInfo[]
    videoInput: MediaDeviceInfo[]
  } | null>(null)
  const [formData, setFormData] = useState({
    audioInput: '',
    audioOutput: '',
    videoInput: '',
  })

  useEffect(() => {
    initDevices()
    setFormData({
      audioInput:
        getDeviceFromLocalStorage('audioInput') ||
        account?.preferredDevices?.audioInput ||
        '',
      audioOutput:
        getDeviceFromLocalStorage('audioOutput') ||
        account?.preferredDevices?.audioOutput ||
        '',
      videoInput:
        getDeviceFromLocalStorage('videoInput') ||
        account?.preferredDevices?.videoInput ||
        '',
    })
  }, [account?.preferredDevices])

  const getDeviceById = (
    type: DeviceType,
    id: string,
  ): MediaDeviceInfo | undefined => {
    if (!devices) return undefined
    return devices[type].find((d) => d.deviceId === id)
  }

  const initDevices = async () => {
    const devices = await getMediaDevices()
    Log.info('Available devices:', devices)
    setDevices(devices)
  }

  async function getMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioInput = devices.filter(
        (device) => device.kind === 'audioinput',
      )
      const audioOutput = devices.filter(
        (device) => device.kind === 'audiooutput',
      )
      const videoInput = devices.filter(
        (device) => device.kind === 'videoinput',
      )

      return { audioInput, audioOutput, videoInput }
    } catch (err) {
      console.error('Error reading audio and video devices:', err)
      return null
    }
  }

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDeviceDialogOpen(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()

    const preferredDevices = { ...formData }
    const updatedAccount = { ...account!, preferredDevices }
    setAccount(() => updatedAccount)

    Object.entries(formData).forEach(([deviceType, value]) => {
      setDeviceToLocalStorage(deviceType as DeviceType, value as string)
    })

    await delay(100)
    window.electron.send(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, formData)
    setIsDeviceDialogOpen(false)
  }

  const handleDeviceChange = (deviceType: DeviceType, deviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      [deviceType]: deviceId,
    }))
  }

  const icons = {
    audioInput: AudioInputsIcon,
    audioOutput: AudioOutputsIcon,
    videoInput: VideoInputsIcon,
  }

  const fieldLabels = {
    audioInput: t('TopBar.Microphone'),
    audioOutput: t('TopBar.Speaker'),
    videoInput: t('TopBar.Camera'),
  }

  return (
    <Modal
      show={true}
      focus={cancelButtonRef}
      onClose={() => setIsDeviceDialogOpen(false)}
      themeMode={parseThemeToClassName(theme)}
      // the device menus open below their button: not clipped by the panel
      className='[&_[id^=headlessui-dialog-panel]]:overflow-visible'
    >
      <form
        onSubmit={handleSubmit}
        className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col gap-6 p-6 text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'
      >
        <DialogTitle className='text-lg font-medium leading-7'>
          {t('TopBar.Preferred devices')}
        </DialogTitle>
        {/* no scrolling here: it would clip the dropdowns, and the content fits the window */}
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-1 text-sm leading-5'>
            {(['audioInput', 'audioOutput', 'videoInput'] as DeviceType[]).map(
              (deviceType) => (
                <div
                  key={deviceType}
                  className='flex flex-row gap-2 items-center w-full '
                >
                  <div className='flex w-28 shrink-0 flex-row items-center gap-2'>
                    <FontAwesomeIcon
                      icon={icons[deviceType]}
                      className='size-4'
                      aria-hidden='true'
                    />
                    <span className='truncate'>{fieldLabels[deviceType]}</span>
                  </div>
                  <div className=''>
                    <Dropdown
                      items={
                        devices?.[deviceType]?.map((device) => {
                          return (
                            <DropdownItem
                              key={device.deviceId}
                              onClick={() => {
                                console.log('change device:', device.deviceId)
                                handleDeviceChange(deviceType, device.deviceId)
                              }}
                            >
                              <div className='flex flex-row items-center gap-2 w-48'>
                                <span
                                  className='truncate'
                                  data-tooltip-id={`device-${deviceType}`}
                                  data-tooltip-content={device.label}
                                >
                                  {device.label}
                                </span>
                                <FontAwesomeIcon
                                  icon={SelectedIcon}
                                  className={
                                    formData[deviceType] === device.deviceId
                                      ? 'visible'
                                      : 'hidden'
                                  }
                                />
                              </div>
                            </DropdownItem>
                          )
                        }) || []
                      }
                      className='w-full'
                    >
                      <DropdownHeader>
                        <div className='relative flex flex-row gap-1 w-48 items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
                          <span
                            className='truncate'
                            data-tooltip-id={`device-${deviceType}`}
                            data-tooltip-content={
                              getDeviceById(deviceType, formData[deviceType])
                                ?.label
                            }
                          >
                            {getDeviceById(deviceType, formData[deviceType])
                              ?.label || '-'}
                          </span>
                          <FontAwesomeIcon icon={DropdownIcon} />
                        </div>
                      </DropdownHeader>
                      <div className='absolute'>
                        <CustomThemedTooltip
                          id={`device-${deviceType}`}
                          place='left'
                          className='z-[10000] text-xs font-medium leading-4'
                          zIndex={10000}
                        />
                      </div>
                    </Dropdown>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
        {/* as the modals of the design system: cancel, then the primary action, on the right */}
        <div className='flex justify-end gap-3'>
          <Button
            ref={cancelButtonRef}
            type='button'
            variant='white'
            onClick={handleCancel}
          >
            {t('Common.Cancel')}
          </Button>
          <Button type='submit'>{t('Common.Save')}</Button>
        </div>
      </form>
    </Modal>
  )
}
