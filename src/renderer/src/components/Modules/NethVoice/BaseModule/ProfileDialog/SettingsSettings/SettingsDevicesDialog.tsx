import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { t } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { PreferredDevices } from '@shared/types'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { DropdownItem } from '@renderer/components/Nethesis/dropdown/DropdownItem'
import { DropdownHeader } from '@renderer/components/Nethesis/dropdown/DropdownHeader'
import { Log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'

type DeviceType = 'audioInput' | 'audioOutput' | 'videoInput'
const LOCALSTORAGE_KEYS = {
  audioInput: 'phone-island-audio-input-device',
  audioOutput: 'phone-island-audio-output-device',
  videoInput: 'phone-island-video-input-device'
} as const

const getDeviceFromLocalStorage = (deviceType: DeviceType): string | null => {
  try {
    const rawValue = localStorage.getItem(LOCALSTORAGE_KEYS[deviceType])
    if (!rawValue) return null

    try {
      const parsed = JSON.parse(rawValue)
      return parsed.deviceId || null
    } catch (parseError) {
      console.warn(`localStorage value for ${deviceType} is not valid JSON, using raw value:`, rawValue)
      return rawValue
    }
  } catch (error) {
    console.warn(`Error reading ${deviceType} from localStorage:`, error)
    return null
  }
}

const setDeviceToLocalStorage = (deviceType: DeviceType, value: string): void => {
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

  const schema: z.ZodType<PreferredDevices> = z.object({
    audioInput: z.string(),
    audioOutput: z.string(),
    videoInput: z.string(),
  })

  const { handleSubmit, control, setValue } = useForm({
    defaultValues: {
      audioInput: '',
      audioOutput: '',
      videoInput: '',
    },
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    initDevices()
  }, [])

  useEffect(() => {
    console.log(account?.preferredDevices)
    const getEffectiveValue = (deviceType: DeviceType): string => {
      const localStorageValue = getDeviceFromLocalStorage(deviceType)
      const storeValue = account?.preferredDevices?.[deviceType]

      // if data exists on localstorage read it
      if (localStorageValue) {
        return localStorageValue
      }

      // otherwise return store value
      return storeValue || ''
    }

    setValue('audioInput', getEffectiveValue('audioInput'))
    setValue('audioOutput', getEffectiveValue('audioOutput'))
    setValue('videoInput', getEffectiveValue('videoInput'))
  }, [account?.preferredDevices])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // check if localstorage keys has changed
      const deviceTypes = Object.keys(LOCALSTORAGE_KEYS) as DeviceType[]
      const changedDeviceType = deviceTypes.find(
        type => e.key === LOCALSTORAGE_KEYS[type]
      )

      if (changedDeviceType && e.newValue) {
        console.log(`localStorage changed for ${changedDeviceType}:`, e.newValue)
        setValue(changedDeviceType, e.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [setValue])

  const getDeviceById = useCallback(
    (type: DeviceType, id: string): MediaDeviceInfo | undefined => {
      if (!devices || !devices[type] || !id) return undefined
      return devices[type].find((d) => d && d.deviceId === id)
    },
    [devices],
  )

  const initDevices = async () => {
    const devices = await getMediaDevices()
    Log.info('Available devices:', devices)
    if (devices?.audioOutput) {
      Log.info('Audio output device IDs:', devices.audioOutput.map(d => ({ id: d.deviceId, label: d.label })))
    }
    if (devices) {
      setDevices(devices)
    }
  }

  async function getMediaDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.warn('Media devices API not available')
        return { audioInput: [], audioOutput: [], videoInput: [] }
      }

      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioInput = devices.filter((device) => device && device.kind === 'audioinput')
      const audioOutput = devices.filter((device) => device && device.kind === 'audiooutput')
      const videoInput = devices.filter((device) => device && device.kind === 'videoinput')

      return { audioInput, audioOutput, videoInput }
    } catch (err) {
      console.error('Error reading audio and video devices:', err)
      return { audioInput: [], audioOutput: [], videoInput: [] }
    }
  }

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDeviceDialogOpen(false)
  }

  async function submit(data) {
    const preferredDevices = {
      ...data,
    }
    const updatedAccount = { ...account!, preferredDevices }
    setAccount(() => updatedAccount)
    Object.entries(data).forEach(([deviceType, value]) => {
      setDeviceToLocalStorage(deviceType as DeviceType, value as string)
    })
    await delay(100)
    window.electron.send(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, data)
    setIsDeviceDialogOpen(false)
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

  const DeviceDropdown = useCallback(
    ({ name }: { name: DeviceType }) => {
      return (
        <div className='flex flex-row gap-2 items-center w-full '>
          <div className='flex flex-row gap-2 items-center w-full min-w-[120px] max-w-[120px] '>
            <FontAwesomeIcon icon={icons[name]} className='w-4' />
            <span className='truncate'>{fieldLabels[name]}</span>
          </div>
          <div>
            <Controller
              control={control}
              name={name}
              render={({ field: { value, onChange } }) => {
                const selectedDevice = getDeviceById(name, value)
                
                // If selected device is not found in current devices list, it might have been disconnected
                if (value && !selectedDevice && devices?.[name] && devices[name].length > 0) {
                  console.warn(`[${name}] Selected device ${value} not found in current devices, device may have been disconnected`)
                }
                return (
                  <Dropdown
                    items={devices?.[name]?.map((device) => {
                      if (!device) return null
                      return (
                        <DropdownItem
                          key={device.deviceId || `device-${Math.random()}`}
                          onClick={(e) => {
                            e?.preventDefault()
                            e?.stopPropagation()
                            
                            if (value !== device.deviceId && device.deviceId) {
                              console.log(`[${name}] change device:`, device.deviceId, 'current:', value)
                              console.log(`[${name}] device label:`, device.label)
                              
                              // Use setTimeout to prevent potential re-render loops
                              setTimeout(() => {
                                onChange(device.deviceId)
                              }, 0)
                            } else {
                              console.log(`[${name}] clicked same device, ignoring:`, device.deviceId)
                            }
                          }}
                        >
                          <div className='flex flex-row items-center gap-2 w-[200px]'>
                            <span
                              className='truncate'
                              data-tooltip-id={`device-${name}`}
                              data-tooltip-content={device.label || 'Unknown device'}
                            >
                              {device.label || 'Unknown device'}
                            </span>
                            <FontAwesomeIcon
                              icon={SelectedIcon}
                              className={
                                selectedDevice?.deviceId === device.deviceId
                                  ? 'visible'
                                  : 'hidden'
                              }
                            />
                          </div>
                        </DropdownItem>
                      )
                    }).filter(Boolean) || []}
                    className='w-full'
                  >
                    <DropdownHeader>
                      <div className='relative flex flex-row gap-1 w-[192px] items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
                        <span
                          className='truncate'
                          data-tooltip-id={`device-${name}`}
                          data-tooltip-content={selectedDevice?.label}
                        >
                          {selectedDevice?.label || '-'}
                        </span>
                        <FontAwesomeIcon icon={DropdownIcon} />
                      </div>
                    </DropdownHeader>
                    <div className='absolute'>
                      <Tooltip
                        id={`device-${name}`}
                        place='left'
                        className='z-[10000] font-medium text-xs leading-[18px]'
                        opacity={1}
                        noArrow={false}
                      />
                    </div>
                  </Dropdown>
                )
              }}
            />
          </div>
        </div>
      )
    },
    [devices, icons, fieldLabels, control, getDeviceById],
  )

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
              <form
                onSubmit={handleSubmit(submit)}
                className='flex flex-col gap-1'
              >
                {/* Input field with clear button next to it */}
                <DeviceDropdown name='audioInput' />
                <DeviceDropdown name='audioOutput' />
                <DeviceDropdown name='videoInput' />

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
