import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, } from '@shared/constants'
import { Extension, PhoneIslandSizes, PreferredDevices, sizeInformationType } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ElectronDraggableWindow } from '@renderer/components/ElectronDraggableWindow'
import { usePhoneIsland } from '@renderer/hooks/usePhoneIsland'
import { PhoneIslandContainer } from '@renderer/components/pageComponents/phoneIsland/phoneIslandContainer'
import { usePhoneIslandEventListener, resetPhoneIslandReadyState } from '@renderer/hooks/usePhoneIslandEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
export function PhoneIslandPage() {
  const [account] = useSharedState('account')
  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const { phoneIsalndSizes, events } = usePhoneIslandEventListener()
  const { createDataConfig, dispatchAndWait } = usePhoneIsland()
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const deviceInformationObject = useRef<Extension | undefined>(undefined)
  const isDataConfigCreated = useRef<boolean>(false)
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)
  const innerPIContainer = useRef<HTMLDivElement | null>(null)
  const isOnLogout = useRef<boolean>(false)
  const eventsRef = useRef<{ [x: string]: (...data: any[]) => void; }>(events)
  const attachedListener = useRef<boolean>(false)
  const lastOpenedUrl = useRef<string | null>(null)
  const urlOpenTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUrlOpening = useRef<boolean>(false)
  const urlOpenAttempts = useRef<number>(0)
  const urlOpenListenerRegistered = useRef<boolean>(false)

  useEffect(() => {
    resize(phoneIsalndSizes)
  }, [phoneIsalndSizes])

  useInitialize(() => {
    Log.debug('INITIALIZE PHONE ISLAND BASE EVENTS')
    loadPath.current = getI18nLoadPath()

    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

    window.electron.receive(IPC_EVENTS.SCREEN_SHARE_SOURCES, (sources: any) => {
      if (typeof navigator.mediaDevices.getDisplayMedia === 'function') {
        navigator.mediaDevices.getDisplayMedia = async (constraints) => {
          // choose always Entire screen to share, add dialog in the future
          // to choose single applications or windows
          const selectedSource = sources.find(source =>
            source.id.startsWith('screen:') || source.name.toLowerCase().includes('screen') || source[0]
          );
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: selectedSource.id,
              }
            } as any
          });
          return stream
        };
      }
    })

    window.electron.receive(IPC_EVENTS.START_CALL, (number: string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.END_CALL, () => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-end'])
    })

    window.electron.receive(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, (devices: PreferredDevices & { shouldRunWarmup?: boolean }) => {
      const { shouldRunWarmup, audioInput, videoInput, audioOutput } = devices
      Log.info('Received CHANGE_PREFERRED_DEVICES in PhoneIslandPage:', { devices, shouldRunWarmup })

      // Run audio warm-up first, only once after PhoneIsland is fully initialized
      // Main process tracks whether warmup has already run (survives re-renders/reconnections)
      // Phone-island also checks for active calls before running warmup
      if (shouldRunWarmup) {
        Log.info('Requesting audio warm-up from main process (first initialization)...')
        setTimeout(() => {
          eventDispatch(PHONE_ISLAND_EVENTS['phone-island-init-audio'])
        }, 1000)

        // Dispatch device changes after warm-up completes (after ~5 seconds)
        setTimeout(() => {
          eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-input-change'], { deviceId: audioInput })
          eventDispatch(PHONE_ISLAND_EVENTS['phone-island-video-input-change'], { deviceId: videoInput })
          eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-output-change'], { deviceId: audioOutput })
        }, 5000)
      } else {
        // If warm-up already done or not needed (reconnection), dispatch device changes immediately
        Log.info('Skipping audio warm-up (already done or reconnection), dispatching device changes immediately')
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-input-change'], { deviceId: audioInput })
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-video-input-change'], { deviceId: videoInput })
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-output-change'], { deviceId: audioOutput })
      }
    })

    window.electron.receive(IPC_EVENTS.CHANGE_RINGTONE_SETTINGS, (settings: { ringtoneName: string; outputDeviceId: string }) => {
      Log.info('Received CHANGE_RINGTONE_SETTINGS in PhoneIslandPage:', settings)

      // Dispatch phone-island event to select ringtone (only the name, phone-island has the base64)
      if (settings.ringtoneName) {
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-ringing-tone-select'], {
          name: settings.ringtoneName,
        })
      }

      // Dispatch phone-island event to set output device
      if (settings.outputDeviceId) {
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-ringing-tone-output'], {
          deviceId: settings.outputDeviceId,
        })
      }
    })

    // Handle ringtone preview play
    window.electron.receive(IPC_EVENTS.PLAY_RINGTONE_PREVIEW, (audioData: { base64_audio_file: string; description: string; type: string }) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-player-start'], audioData)
    })

    // Handle ringtone preview stop
    window.electron.receive(IPC_EVENTS.STOP_RINGTONE_PREVIEW, () => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-player-pause'], {})
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-player-close'], {})
    })

    // Load and apply saved ringtone settings on PhoneIsland ready
    window.electron.receive(IPC_EVENTS.PHONE_ISLAND_READY, () => {
      // Wait a bit for phone-island to fully initialize
      setTimeout(() => {
        try {
          // Load saved ringtone from localStorage
          const savedRingtoneRaw = localStorage.getItem('phone-island-ringing-tone')
          const savedOutputDeviceRaw = localStorage.getItem('phone-island-ringing-tone-output')

          let ringtoneName: string | null = null
          let outputDeviceId: string | null = null

          if (savedRingtoneRaw) {
            try {
              const parsed = JSON.parse(savedRingtoneRaw)
              ringtoneName = parsed.name || null
            } catch {
              ringtoneName = savedRingtoneRaw
            }
          }

          if (savedOutputDeviceRaw) {
            try {
              const parsed = JSON.parse(savedOutputDeviceRaw)
              outputDeviceId = parsed.deviceId || null
            } catch {
              outputDeviceId = savedOutputDeviceRaw
            }
          }

          if (ringtoneName || outputDeviceId) {
            Log.info('Applying saved ringtone settings on startup:', { ringtoneName, outputDeviceId })

            if (ringtoneName) {
              eventDispatch(PHONE_ISLAND_EVENTS['phone-island-ringing-tone-select'], {
                name: ringtoneName,
              })
            }

            if (outputDeviceId) {
              eventDispatch(PHONE_ISLAND_EVENTS['phone-island-ringing-tone-output'], {
                deviceId: outputDeviceId,
              })
            }
          }
        } catch (error) {
          Log.error('Error loading saved ringtone settings:', error)
        }
      }, 1000)
    })

    window.electron.receive(IPC_EVENTS.TRANSFER_CALL, (to: string) => {
      Log.info("Receive event and send Transfer to", to)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-transfer'], {
        to
      })
    })

    window.electron.receive(IPC_EVENTS.INTRUDE_CALL, (to: string) => {
      Log.info("Receive event and send Intrude to", to)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-intrude'], {
        to
      })
    })

    window.electron.receive(IPC_EVENTS.LISTEN_CALL, (to: string) => {
      Log.info("Receive event and send Listen to", to)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-listen'], {
        to
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      logout()
    })

    window.electron.receive(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, async (deviceInformationObject, force) => {
      Log.debug('CHANGE_DEFAULT_DEVICE', { force, deviceInformationObject, })
      const changed = await NethVoiceAPI.User.default_device(deviceInformationObject, force)
      Log.debug('CHANGE_DEFAULT_DEVICE', { changed })
      if (changed) {
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-default-device-change'], { deviceInformationObject })
      }
    })

    if (!urlOpenListenerRegistered.current) {
      urlOpenListenerRegistered.current = true;

      window.electron.receive(IPC_EVENTS.URL_OPEN, (urlInfo: string) => {
        urlOpenAttempts.current++;

        if (isUrlOpening.current) {
          return;
        }

        if (lastOpenedUrl.current === urlInfo) {
          return;
        }

        isUrlOpening.current = true;
        lastOpenedUrl.current = urlInfo;

        window.api.openExternalPage(urlInfo);
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-already-opened-external-page'], {});

        urlOpenAttempts.current = 0;

        if (urlOpenTimeout.current) {
          clearTimeout(urlOpenTimeout.current);
        }

        urlOpenTimeout.current = setTimeout(() => {
          isUrlOpening.current = false;
          lastOpenedUrl.current = null;
          urlOpenTimeout.current = null;
        }, 5000);
      });
    }

  })

  useEffect(() => {
    return () => {
      if (urlOpenTimeout.current) {
        clearTimeout(urlOpenTimeout.current);
        urlOpenTimeout.current = null;
      }
      isUrlOpening.current = false;
      lastOpenedUrl.current = null;
      urlOpenAttempts.current = 0;
    };
  }, []);

  const resize = (phoneIsalndSize: PhoneIslandSizes) => {
    if (!isOnLogout.current) {
      const { width, height, top, bottom, left, right, bottomTranscription } = phoneIsalndSize.sizes
      const w = Number(width.replace('px', ''))
      const h = Number(height.replace('px', ''))
      const r = Number((right ?? '0px').replace('px', ''))
      const transcription  = Number((bottomTranscription ?? '0px').replace('px', ''))
      const t = Number((top ?? '0px').replace('px', ''))
      const l = Number((left ?? '0px').replace('px', ''))
      const b = Number((bottom ?? '0px').replace('px', ''))
      const data = {
        width,
        height,
        bottom: bottom ?? '0px',
        top: top ?? '0px',
        right: right ?? '0px',
        left: left ?? '0px',
        transcription: bottomTranscription ?? '0px',
      }
      phoneIslandContainer.current?.setAttribute('style', `
        width: calc(100vw + ${data.right} + ${data.left});
        height: calc(100vh + ${data.top} + ${data.bottom} + ${data.transcription});
      `)
      innerPIContainer.current?.setAttribute('style', `
        margin-left: calc(${data.left} - ${data.right});
        margin-top: calc(${data.transcription} * -1);
      `)

      window.api.resizePhoneIsland({
        w: w + r + l,
        h: h + t + b + transcription ,
      })
    }
  }



  useEffect(() => {
    if (account && !isDataConfigCreated.current) {
      isDataConfigCreated.current = true
      createDataConfig(account).then(([deviceInformation, dataConfig]) => {
        deviceInformationObject.current = { ...deviceInformation }
        setDataConfig(dataConfig)
      }).catch((e) => {
        isDataConfigCreated.current = false
      })
    }
  }, [account])

  useEffect(() => {
    if (account && Object.keys(eventsRef.current).length > 0 && !attachedListener.current) {
      Log.debug(account?.username, 'attachd listeners', Object.keys(eventsRef.current).length)
      Object.entries(eventsRef.current).forEach(([phoneIslandEventName, callback]) => {
        window.addEventListener(phoneIslandEventName, callback)
      })
      attachedListener.current = true
    }
  }, [account, dataConfig])

  const destroyAllListeners = () => {
    Log.debug(account?.username, 'deattached listeners', Object.keys(eventsRef.current).length)
    Object.entries(eventsRef.current).forEach(([phoneIslandEventName, callback]) => {
      window.removeEventListener(phoneIslandEventName, callback)
    })
    attachedListener.current = false
  }

  async function logout() {
    isOnLogout.current = true
    // Reset phone island ready state to allow re-initialization on next login
    resetPhoneIslandReadyState()
    if (deviceInformationObject.current) {
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-call-end'], PHONE_ISLAND_EVENTS['phone-island-call-ended'])
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-detach'], PHONE_ISLAND_EVENTS['phone-island-detached'], {
        data: {
          deviceInformationObject: deviceInformationObject.current //nethlink extension
        }
      })
    }
    setDataConfig(undefined)
    isDataConfigCreated.current = false
    destroyAllListeners()
    await delay(250)
    window.electron.send(IPC_EVENTS.LOGOUT_COMPLETED)
  }

  useEffect(() => {
    return () => {
      if (urlOpenTimeout.current) {
        clearTimeout(urlOpenTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={phoneIslandContainer}
      id={'phone-island-container'}
    >

      <div style={{
        position: 'absolute',
        height: '100vh',
        width: '100vw',
        ...(isDev() ? {
          backgroundColor: '#058D1150',
        } : {}),

      }}
      ></div>
      <ElectronDraggableWindow>
        <div ref={innerPIContainer} id='phone-island-inner-container' className='relative w-full h-full'>
          {account && <PhoneIslandContainer dataConfig={dataConfig} deviceInformationObject={deviceInformationObject.current} isDataConfigCreated={isDataConfigCreated.current} />}
        </div>
      </ElectronDraggableWindow>
    </div >
  )
}


