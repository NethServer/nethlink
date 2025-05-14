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
import { usePhoneIslandEventListener } from '@renderer/hooks/usePhoneIslandEventListeners'
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
      //controllare se sono physical
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.END_CALL, () => {
      //controllare se sono physical
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-end'])
    })

    window.electron.receive(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, (devices: PreferredDevices) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-input-change'], { deviceId: devices.audioInput })
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-video-input-change'], { deviceId: devices.videoInput })
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-audio-output-change'], { deviceId: devices.audioOutput })
    })

    window.electron.receive(IPC_EVENTS.TRANSFER_CALL, (to: string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-transfer'], {
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
  })

  const resize = (phoneIsalndSize: PhoneIslandSizes) => {
    if (!isOnLogout.current) {
      const { width, height, top, bottom, left, right } = phoneIsalndSize.sizes
      const w = Number(width.replace('px', ''))
      const h = Number(height.replace('px', ''))
      const r = Number((right ?? '0px').replace('px', ''))
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
      }
      phoneIslandContainer.current?.setAttribute('style', `
        width: calc(100vw + ${data.right} + ${data.left});
        height: calc(100vh + ${data.top} + ${data.bottom});
      `)

      innerPIContainer.current?.setAttribute('style', `
        margin-left: calc(${data.left} - ${data.right});
      `) //calc(${data.top} - ${data.bottom})

      window.api.resizePhoneIsland({
        w: w + r + l,
        h: h + t + b
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


