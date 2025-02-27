import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, } from '@shared/constants'
import { Extension, PhoneIslandSizes } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { useState, useRef, useEffect } from 'react'
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
  const isOnLogout = useRef<boolean>(false)
  const eventsRef = useRef<{ [x: string]: (...data: any[]) => void; }>(events)
  const attachedListener = useRef<boolean>(false)

  useEffect(() => {
    resize(phoneIsalndSizes)
  }, [phoneIsalndSizes])

  useInitialize(() => {
    Log.info('INITIALIZE PHONE ISLAND BASE EVENTS')
    loadPath.current = getI18nLoadPath()

    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

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

    window.electron.receive(IPC_EVENTS.TRANSFER_CALL, (to: string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-transfer'], {
        to
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      logout()
    })

    window.electron.receive(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, async (deviceInformationObject, force) => {
      Log.info('CHANGE_DEFAULT_DEVICE', { force, deviceInformationObject, })
      const changed = await NethVoiceAPI.User.default_device(deviceInformationObject, force)
      Log.info('CHANGE_DEFAULT_DEVICE', { changed })
      if (changed) {
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-default-device-change'], { deviceInformationObject })
      }
    })
  })

  const resize = (phoneIsalndSize: PhoneIslandSizes) => {
    if (!isOnLogout.current) {
      const { width, height, top, bottom, left, right } = phoneIsalndSize.sizes

      phoneIslandContainer.current?.children[1].setAttribute('style',
        `
            position: relative;
            height: calc(100vh + ${top ?? '0px'} + ${bottom ?? '0px'});
            width: calc(100vw + ${left ?? '0px'} + ${right ?? '0px'});
            left: ${left ?? '0px'};
            right: ${right ?? '0px'};
            top: ${top ?? '0px'};
            bottom: ${bottom ?? '0px'};
          `
      )
      const w = Number(width.replace('px', ''))
      const h = Number(height.replace('px', ''))
      const r = Number((right ?? '0px').replace('px', ''))
      const t = Number((top ?? '0px').replace('px', ''))
      const l = Number((left ?? '0px').replace('px', ''))
      const b = Number((bottom ?? '0px').replace('px', ''))
      window.api.resizePhoneIsland({
        w: w + r + l,
        h: h + t + b
      })
    }
  }



  useEffect(() => {
    if (account && !isDataConfigCreated.current) {
      createDataConfig(account).then(([deviceInformation, dataConfig]) => {
        deviceInformationObject.current = { ...deviceInformation }
        setDataConfig(dataConfig)
        isDataConfigCreated.current = true
      }).catch((e) => {

      })
    }
  }, [account])

  useEffect(() => {
    if (account && Object.keys(eventsRef.current).length > 0 && !attachedListener.current) {
      Log.info(account?.username, 'attachd listeners', Object.keys(eventsRef.current).length)
      Object.entries(eventsRef.current).forEach(([phoneIslandEventName, callback]) => {
        window.addEventListener(phoneIslandEventName, callback)
      })
      attachedListener.current = true
    }
  }, [account, dataConfig])

  const destroyAllListeners = () => {
    Log.info(account?.username, 'deattached listeners', Object.keys(eventsRef.current).length)
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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 9999,
        overflow: 'hidden',
      }}
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
        <div
          id="phone-island-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start'
          }}>
          {account && <PhoneIslandContainer dataConfig={dataConfig} deviceInformationObject={deviceInformationObject.current} isDataConfigCreated={isDataConfigCreated.current} />}
        </div>
      </ElectronDraggableWindow>
    </div >
  )
}


