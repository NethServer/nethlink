import { Button } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { Backdrop } from '../../Backdrop'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMicrophone as AudioInputsIcon,
  faVolumeHigh as AudioOutputsIcon,
  faVideo as VideoInputsIcon,
  faChevronDown as DropdownIcon,
  faCheck as SelectedIcon,
} from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from 'react-tooltip'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { DropdownItem } from '@renderer/components/Nethesis/dropdown/DropdownItem'
import { DropdownHeader } from '@renderer/components/Nethesis/dropdown/DropdownHeader'
import { Log } from '@shared/utils/logger'
import { delay } from '@shared/utils/utils'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'

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

  const isDeviceUnavailable =
    account?.data?.default_device?.type == 'webrtc' ||
    account?.data?.mainPresence !== 'online'

  return (
    <>
      {/* Background color */}
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />

      {/* On external click close dialog */}
      <Backdrop
        className='z-[202]'
        onBackdropClick={() => setIsDeviceDialogOpen(false)}
      />

      <div className='fixed inset-0 z-[205] overflow-y-auto pointer-events-none'>
        <div className='flex min-h-full items-center justify-center p-4 pointer-events-none'>
          <div className='bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-xl shadow-lg max-w-sm w-full pointer-events-auto'>
            {/* Dialog content */}
            <div className='p-6 flex flex-col gap-4'>
              {/* Title */}
              <h2 className='text-center font-semibold text-xl'>
                {t('TopBar.Preferred devices')}
              </h2>

              {/* Form */}
              <form onSubmit={handleSubmit} className='flex flex-col gap-1'>
                {/* Input field with clear button next to it */}
                {(
                  ['audioInput', 'audioOutput', 'videoInput'] as DeviceType[]
                ).map((deviceType) => (
                  <div
                    key={deviceType}
                    className='flex flex-row gap-2 items-center w-full '
                  >
                    <div className='flex flex-row gap-2 items-center w-full min-w-[120px] max-w-[120px] '>
                      <FontAwesomeIcon
                        icon={icons[deviceType]}
                        className='w-4'
                      />
                      <span className='truncate'>
                        {fieldLabels[deviceType]}
                      </span>
                    </div>
                    <div className=''>
                      <Dropdown
                        items={devices?.[deviceType].map((device) => {
                          return (
                            <DropdownItem
                              key={device.deviceId}
                              onClick={() => {
                                console.log('change device:', device.deviceId)
                                handleDeviceChange(deviceType, device.deviceId)
                              }}
                            >
                              <div className='flex flex-row items-center gap-2 w-[200px]'>
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
                        })}
                        className='w-full'
                      >
                        <DropdownHeader>
                          <div className='relative flex flex-row gap-1 w-[192px] items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
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
                          <Tooltip
                            id={`device-${deviceType}`}
                            place='left'
                            className='z-[10000] font-medium text-xs leading-[18px]'
                            opacity={1}
                            noArrow={false}
                          />
                        </div>
                      </Dropdown>
                    </div>
                  </div>
                ))}

                {/* Inline notification */}
                {isDeviceUnavailable && (
                  <InlineNotification
                    title={t('Common.Warning')}
                    type='warning'
                    className=''
                  >
                    <p>{t('Devices.Inline warning message devices')}</p>
                  </InlineNotification>
                )}
                {/* Action buttons */}
                <div className='flex flex-col gap-3 mt-2'>
                  <Button
                    variant='primary'
                    type='submit'
                    className='w-full py-3 rounded-lg font-medium'
                    disabled={isDeviceUnavailable}
                  >
                    {t('Common.Save')}
                  </Button>

                  <Button
                    variant='ghost'
                    type='button'
                    onClick={handleCancel}
                    className='text-center text-blue-700 dark:text-blue-500 font-medium'
                  >
                    {t('Common.Cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
