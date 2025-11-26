import { Button } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { Backdrop } from '../../Backdrop'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell as RingtoneIcon,
  faVolumeHigh as AudioOutputsIcon,
  faChevronDown as DropdownIcon,
  faCheck as SelectedIcon,
  faPlay as PlayIcon,
  faStop as StopIcon,
} from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from 'react-tooltip'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { DropdownItem } from '@renderer/components/Nethesis/dropdown/DropdownItem'
import { DropdownHeader } from '@renderer/components/Nethesis/dropdown/DropdownHeader'
import { Log } from '@shared/utils/logger'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'

interface Ringtone {
  name: string
  base64: string
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const LOCALSTORAGE_KEYS = {
  ringtone: 'phone-island-ringing-tone',
  outputDevice: 'phone-island-ringing-tone-output',
} as const

const getRingtoneFromLocalStorage = (): string | null => {
  try {
    const rawValue = localStorage.getItem(LOCALSTORAGE_KEYS.ringtone)
    if (!rawValue) return null

    try {
      const parsed = JSON.parse(rawValue)
      return parsed.name || null
    } catch (parseError) {
      console.warn(
        'localStorage value for ringtone is not valid JSON, using raw value:',
        rawValue,
      )
      return rawValue
    }
  } catch (error) {
    console.warn('Error reading ringtone from localStorage:', error)
    return null
  }
}

const setRingtoneToLocalStorage = (value: string): void => {
  try {
    const jsonValue = JSON.stringify({ name: value })
    localStorage.setItem(LOCALSTORAGE_KEYS.ringtone, jsonValue)
  } catch (error) {
    console.warn('Error saving ringtone to localStorage:', error)
  }
}

const getOutputDeviceFromLocalStorage = (): string | null => {
  try {
    const rawValue = localStorage.getItem(LOCALSTORAGE_KEYS.outputDevice)
    if (!rawValue) return null

    try {
      const parsed = JSON.parse(rawValue)
      return parsed.deviceId || null
    } catch (parseError) {
      console.warn(
        'localStorage value for output device is not valid JSON, using raw value:',
        rawValue,
      )
      return rawValue
    }
  } catch (error) {
    console.warn('Error reading output device from localStorage:', error)
    return null
  }
}

const setOutputDeviceToLocalStorage = (value: string): void => {
  try {
    const jsonValue = JSON.stringify({ deviceId: value })
    localStorage.setItem(LOCALSTORAGE_KEYS.outputDevice, jsonValue)
  } catch (error) {
    console.warn('Error saving output device to localStorage:', error)
  }
}

export function SettingsIncomingCallsDialog() {
  const [, setIsIncomingCallsDialogOpen] = useNethlinkData('isIncomingCallsDialogOpen')
  const [availableRingtones] = useSharedState('availableRingtones')
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([])
  const [playingRingtone, setPlayingRingtone] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ringtone: '',
    outputDevice: '',
  })

  // Convert availableRingtones from store to local format
  const ringtones: Ringtone[] = (availableRingtones || []).map(r => ({
    name: r.name,
    base64: r.base64
  }))

  useEffect(() => {
    initAudioOutputDevices()

    // Load saved preferences from localStorage
    const savedRingtone = getRingtoneFromLocalStorage()
    const savedOutputDevice = getOutputDeviceFromLocalStorage()

    setFormData({
      ringtone: savedRingtone || '',
      outputDevice: savedOutputDevice || '',
    })

    // Listen for audio player close event
    const handleAudioPlayerClose = () => {
      setPlayingRingtone(null)
    }

    window.addEventListener(
      PHONE_ISLAND_EVENTS['phone-island-audio-player-close'],
      handleAudioPlayerClose,
    )

    return () => {
      window.removeEventListener(
        PHONE_ISLAND_EVENTS['phone-island-audio-player-close'],
        handleAudioPlayerClose,
      )
    }
  }, [availableRingtones])

  const initAudioOutputDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutput = devices.filter((device) => device.kind === 'audiooutput')
      Log.info('Available audio output devices:', audioOutput)
      setAudioOutputDevices(audioOutput)
    } catch (err) {
      console.error('Error reading audio output devices:', err)
    }
  }

  const getRingtoneByName = (name: string): Ringtone | undefined => {
    return ringtones.find((r) => r.name === name)
  }

  const getDeviceById = (id: string): MediaDeviceInfo | undefined => {
    return audioOutputDevices.find((d) => d.deviceId === id)
  }

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsIncomingCallsDialogOpen(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()

    // Save to localStorage
    setRingtoneToLocalStorage(formData.ringtone)
    setOutputDeviceToLocalStorage(formData.outputDevice)

    Log.info('Sending ringtone settings via IPC:', {
      ringtone: formData.ringtone,
      outputDevice: formData.outputDevice,
    })

    // Send IPC event to PhoneIslandPage to apply settings
    window.electron.send(IPC_EVENTS.CHANGE_RINGTONE_SETTINGS, {
      ringtoneName: formData.ringtone,
      outputDeviceId: formData.outputDevice,
    })

    setIsIncomingCallsDialogOpen(false)
  }

  const handleRingtoneChange = (ringtoneName: string) => {
    setFormData((prev) => ({
      ...prev,
      ringtone: ringtoneName,
    }))
  }

  const handleOutputDeviceChange = (deviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      outputDevice: deviceId,
    }))
  }

  // Play ringtone preview
  const playRingtonePreview = (ringtone: Ringtone) => {
    setPlayingRingtone(ringtone.name)
    Log.info('Playing ringtone preview via IPC:', ringtone.name)
    window.electron.send(IPC_EVENTS.PLAY_RINGTONE_PREVIEW, {
      base64_audio_file: ringtone.base64,
      description: capitalizeFirstLetter(ringtone.name),
      type: 'ringtone_preview',
    })
  }

  // Stop ringtone preview
  const stopRingtonePreview = () => {
    setPlayingRingtone(null)
    Log.info('Stopping ringtone preview via IPC')
    window.electron.send(IPC_EVENTS.STOP_RINGTONE_PREVIEW, {})
  }

  return (
    <>
      {/* Background color */}
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />

      {/* On external click close dialog */}
      <Backdrop
        className='z-[202]'
        onBackdropClick={() => setIsIncomingCallsDialogOpen(false)}
      />

      <div className='fixed inset-0 z-[205] overflow-y-auto pointer-events-none'>
        <div className='flex min-h-full items-center justify-center p-4 pointer-events-none'>
          <div className='bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-xl shadow-lg max-w-sm w-full pointer-events-auto'>
            {/* Dialog content */}
            <div className='p-6 flex flex-col gap-4'>
              {/* Title */}
              <h2 className='text-center font-semibold text-xl'>
                {t('Settings.IncomingCalls')}
              </h2>

              {/* Form */}
              <form onSubmit={handleSubmit} className='flex flex-col gap-1'>
                {/* Ringtone selection */}
                <div className='flex flex-row gap-2 items-center w-full'>
                  <div className='flex flex-row gap-2 items-center w-full min-w-[120px] max-w-[120px]'>
                    <FontAwesomeIcon icon={RingtoneIcon} className='w-4' />
                    <span className='truncate'>{t('Settings.Ringtone')}</span>
                  </div>
                  <div className='flex flex-row gap-2 items-center flex-1'>
                    <div className='flex-1'>
                      <Dropdown
                        items={
                          ringtones?.map((ringtone) => {
                            return (
                              <DropdownItem
                                key={ringtone.name}
                                onClick={() => {
                                  handleRingtoneChange(ringtone.name)
                                }}
                              >
                                <div className='flex flex-row items-center gap-2 w-[140px]'>
                                  <span
                                    className='truncate'
                                    data-tooltip-id='ringtone'
                                    data-tooltip-content={capitalizeFirstLetter(ringtone.name)}
                                  >
                                    {capitalizeFirstLetter(ringtone.name)}
                                  </span>
                                  <FontAwesomeIcon
                                    icon={SelectedIcon}
                                    className={
                                      formData.ringtone === ringtone.name
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
                          <div className='relative flex flex-row gap-1 w-[132px] items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
                            <span
                              className='truncate'
                              data-tooltip-id='ringtone'
                              data-tooltip-content={
                                capitalizeFirstLetter(getRingtoneByName(formData.ringtone)?.name || '')
                              }
                            >
                              {capitalizeFirstLetter(getRingtoneByName(formData.ringtone)?.name || '') || '-'}
                            </span>
                            <FontAwesomeIcon icon={DropdownIcon} />
                          </div>
                        </DropdownHeader>
                        <div className='absolute'>
                          <Tooltip
                            id='ringtone'
                            place='left'
                            className='z-[10000] font-medium text-xs leading-[18px]'
                            opacity={1}
                            noArrow={false}
                          />
                        </div>
                      </Dropdown>
                    </div>

                    {/* Play/Stop button */}
                    <button
                      type='button'
                      onClick={() => {
                        const selectedRingtone = getRingtoneByName(formData.ringtone)
                        if (playingRingtone === formData.ringtone) {
                          stopRingtonePreview()
                        } else if (selectedRingtone) {
                          playRingtonePreview(selectedRingtone)
                        }
                      }}
                      disabled={!formData.ringtone}
                      className='px-2.5 py-1.5 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0'
                    >
                      <FontAwesomeIcon
                        icon={playingRingtone === formData.ringtone ? StopIcon : PlayIcon}
                        className='w-3.5 h-3.5 text-white'
                      />
                    </button>
                  </div>
                </div>

                {/* Output device selection */}
                <div className='flex flex-row gap-2 items-center w-full'>
                  <div className='flex flex-row gap-2 items-center w-full min-w-[120px] max-w-[120px]'>
                    <FontAwesomeIcon icon={AudioOutputsIcon} className='w-4' />
                    <span className='truncate'>{t('TopBar.Speaker')}</span>
                  </div>
                  <div className=''>
                    <Dropdown
                      items={
                        audioOutputDevices?.map((device) => {
                          return (
                            <DropdownItem
                              key={device.deviceId}
                              onClick={() => {
                                handleOutputDeviceChange(device.deviceId)
                              }}
                            >
                              <div className='flex flex-row items-center gap-2 w-[200px]'>
                                <span
                                  className='truncate'
                                  data-tooltip-id='output-device'
                                  data-tooltip-content={device.label}
                                >
                                  {device.label}
                                </span>
                                <FontAwesomeIcon
                                  icon={SelectedIcon}
                                  className={
                                    formData.outputDevice === device.deviceId
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
                        <div className='relative flex flex-row gap-1 w-[192px] items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
                          <span
                            className='truncate'
                            data-tooltip-id='output-device'
                            data-tooltip-content={
                              getDeviceById(formData.outputDevice)?.label
                            }
                          >
                            {getDeviceById(formData.outputDevice)?.label || '-'}
                          </span>
                          <FontAwesomeIcon icon={DropdownIcon} />
                        </div>
                      </DropdownHeader>
                      <div className='absolute'>
                        <Tooltip
                          id='output-device'
                          place='left'
                          className='z-[10000] font-medium text-xs leading-[18px]'
                          opacity={1}
                          noArrow={false}
                        />
                      </div>
                    </Dropdown>
                  </div>
                </div>

                {/* Action buttons */}
                <div className='flex flex-col gap-3 mt-2'>
                  <Button
                    variant='primary'
                    type='submit'
                    className='w-full py-3 rounded-lg font-medium'
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
