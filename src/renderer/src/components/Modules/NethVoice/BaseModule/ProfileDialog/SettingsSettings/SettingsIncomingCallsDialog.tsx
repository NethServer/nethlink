import { Button } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { parseThemeToClassName } from '@renderer/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell as RingtoneIcon,
  faVolumeHigh as AudioOutputsIcon,
  faChevronDown as DropdownIcon,
  faCheck as SelectedIcon,
  faPlay as PlayIcon,
  faStop as StopIcon,
} from '@fortawesome/free-solid-svg-icons'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { DropdownItem } from '@renderer/components/Nethesis/dropdown/DropdownItem'
import { DropdownHeader } from '@renderer/components/Nethesis/dropdown/DropdownHeader'
import { Log } from '@shared/utils/logger'
import { IPC_EVENTS } from '@shared/constants'

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
  const [, setIsIncomingCallsDialogOpen] = useNethlinkData(
    'isIncomingCallsDialogOpen',
  )
  const [availableRingtones] = useSharedState('availableRingtones')
  const [theme] = useSharedState('theme')
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceInfo[]
  >([])
  const [playingRingtone, setPlayingRingtone] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ringtone: '',
    outputDevice: '',
  })

  // Convert availableRingtones from store to local format
  const ringtones: Ringtone[] = (availableRingtones || []).map((r) => ({
    name: r.name,
    base64: r.base64,
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

    // Listen for audio player closed via IPC
    window.electron.receive(IPC_EVENTS.AUDIO_PLAYER_CLOSED, () => {
      setPlayingRingtone(null)
    })

    return () => {
      // Cleanup IPC listener
    }
  }, [availableRingtones])

  const initAudioOutputDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutput = devices.filter(
        (device) => device.kind === 'audiooutput',
      )
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

    // Stop audio player if playing
    if (playingRingtone) {
      window.electron.send(IPC_EVENTS.STOP_RINGTONE_PREVIEW, {})
    }

    // Save to localStorage
    setRingtoneToLocalStorage(formData.ringtone)
    setOutputDeviceToLocalStorage(formData.outputDevice)

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
    window.electron.send(IPC_EVENTS.STOP_RINGTONE_PREVIEW, {})
  }

  return (
    <Modal
      show={true}
      focus={cancelButtonRef}
      onClose={() => setIsIncomingCallsDialogOpen(false)}
      themeMode={parseThemeToClassName(theme)}
      // the ringtone and device menus open below their button: not clipped by the panel
      className='[&_[id^=headlessui-dialog-panel]]:overflow-visible'
    >
      <form
        onSubmit={handleSubmit}
        className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col gap-6 p-6 text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'
      >
        <DialogTitle className='text-lg font-medium leading-7'>
          {t('Settings.IncomingCalls')}
        </DialogTitle>
        {/* no scrolling here: it would clip the dropdowns, and the content fits the window */}
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col gap-1 text-sm leading-5'>
            {/* Ringtone selection */}
            <div className='flex flex-row gap-2 items-center w-full'>
              <div className='flex w-28 shrink-0 flex-row items-center gap-2'>
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
                            <div className='flex flex-row items-center gap-2 w-36'>
                              <span
                                className='truncate'
                                data-tooltip-id='ringtone'
                                data-tooltip-content={capitalizeFirstLetter(
                                  ringtone.name,
                                )}
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
                      <div className='relative flex flex-row gap-1 w-32 items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
                        <span
                          className='truncate'
                          data-tooltip-id='ringtone'
                          data-tooltip-content={capitalizeFirstLetter(
                            getRingtoneByName(formData.ringtone)?.name || '',
                          )}
                        >
                          {capitalizeFirstLetter(
                            getRingtoneByName(formData.ringtone)?.name || '',
                          ) || '-'}
                        </span>
                        <FontAwesomeIcon icon={DropdownIcon} />
                      </div>
                    </DropdownHeader>
                    <div className='absolute'>
                      <CustomThemedTooltip
                        id='ringtone'
                        place='left'
                        className='z-[10000] text-xs font-medium leading-4'
                        zIndex={10000}
                      />
                    </div>
                  </Dropdown>
                </div>

                {/* Play/Stop button */}
                <button
                  type='button'
                  onClick={() => {
                    const selectedRingtone = getRingtoneByName(
                      formData.ringtone,
                    )
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
                    icon={
                      playingRingtone === formData.ringtone
                        ? StopIcon
                        : PlayIcon
                    }
                    className='w-3.5 h-3.5 text-white'
                  />
                </button>
              </div>
            </div>

            {/* Output device selection */}
            <div className='flex flex-row gap-2 items-center w-full'>
              <div className='flex w-28 shrink-0 flex-row items-center gap-2'>
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
                          <div className='flex flex-row items-center gap-2 w-48'>
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
                    <div className='relative flex flex-row gap-1 w-48 items-center justify-between rounded-md px-2 py-1 hover:bg-hoverLight dark:hover:bg-hoverDark'>
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
                    <CustomThemedTooltip
                      id='output-device'
                      place='left'
                      className='z-[10000] text-xs font-medium leading-4'
                      zIndex={10000}
                    />
                  </div>
                </Dropdown>
              </div>
            </div>
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
