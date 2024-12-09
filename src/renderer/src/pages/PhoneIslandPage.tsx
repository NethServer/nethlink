import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, } from '@shared/constants'
import { Extension, PhoneIslandData, PhoneIslandView, Size } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { debouncer, delay, isDev } from '@shared/utils/utils'
import { useState, useRef, useEffect } from 'react'
import { ElectronDraggableWindow } from '@renderer/components/ElectronDraggableWindow'
import { usePhoneIsland } from '@renderer/hooks/usePhoneIsland'
import { PhoneIslandContainer } from '@renderer/components/pageComponents/phoneIsland/phoneIslandContainer'
import { usePhoneIslandEventListener } from '@renderer/hooks/usePhoneIslandEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
export function PhoneIslandPage() {
  const [account] = useSharedState('account')
  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const { state, phoneIsalndSizes, events } = usePhoneIslandEventListener()
  const { createDataConfig, dispatchAndWait } = usePhoneIsland()

  const deviceInformationObject = useRef<Extension | undefined>(undefined)
  const isDataConfigCreated = useRef<boolean>(false)
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)
  const isOnLogout = useRef<boolean>(false)
  const eventsRef = useRef<{ [x: string]: (...data: any[]) => void; }>(events)
  const attachedListener = useRef<boolean>(false)
  const lastSize = useRef<Size>()

  useEffect(() => {
    debouncer('phoneisland-resize', () => {
      Log.info('RESIZE')
      resize(phoneIsalndSizes.size, state)
    }, 50)
  }, [phoneIsalndSizes, state])

  useInitialize(() => {
    Log.info('INITIALIZE PHONE ISLAND BASE EVENTS')
    loadPath.current = getI18nLoadPath()

    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

    window.electron.receive(IPC_EVENTS.START_CALL, (number: string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      logout()
    })
  })

  const resize = (size: Size, state: PhoneIslandData) => {
    if (!isOnLogout.current && (lastSize.current?.w !== size.w || lastSize.current?.h !== size.h)) {
      lastSize.current = size
      const { view } = state
      Log.info(`RESIZE ${size.w}x${size.h} ${account?.username} ${view}`)
      if (view === PhoneIslandView.KEYPAD || view === PhoneIslandView.TRANSFER || state.currentCall.transferring) {
        phoneIslandContainer.current?.children[1].setAttribute('style', 'height: calc(100vh + 40px); position: relative;')
      } else if (view === PhoneIslandView.CALL) {
        phoneIslandContainer.current?.children[1].setAttribute('style', '')
      }
      window.api.resizePhoneIsland(size)
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
          deviceInformationObject: deviceInformationObject.current
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
          {account && <PhoneIslandContainer dataConfig={dataConfig} i18nLoadPath={loadPath.current} deviceInformationObject={deviceInformationObject.current} isDataConfigCreated={isDataConfigCreated.current} />}
        </div>
      </ElectronDraggableWindow>
    </div >
  )
}


