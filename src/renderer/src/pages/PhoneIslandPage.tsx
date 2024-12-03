import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useStoreState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, } from '@shared/constants'
import { Account, Extension, PhoneIslandData, PhoneIslandView, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { useRefState } from '@renderer/hooks/useRefState'
import { useState, useRef, useEffect, useMemo } from 'react'
import { ElectronDraggableWindow } from '@renderer/components/ElectronDraggableWindow'
import { usePhoneIsland } from '@renderer/hooks/usePhoneIsland'
import { PhoneIslandContainer } from '@renderer/components/pageComponents/phoneIsland/phoneIslandContainer'
import { usePhoneIslandEventListener } from '@renderer/hooks/usePhoneIslandEventListeners'
export function PhoneIslandPage() {
  const [account] = useStoreState<Account | undefined>('account')

  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const [deviceInformationObject, setDeviceInformationObject] = useRefState<Extension | undefined>(useState<Extension | undefined>(undefined))

  const isDataConfigCreated = useRef<boolean>(false)
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)
  const isOnLogout = useRef<boolean>(false)
  const { state, phoneIsalndSizes, events } = usePhoneIslandEventListener()
  const [listeners, setListeners] = useState<{ [x: string]: (...data: any[]) => Promise<void>; }>({})

  const hasInitialized = useRef<boolean>(false)
  const attachedListener = useRef<boolean>(false)

  useEffect(() => {
    resize(phoneIsalndSizes.size, state)
  }, [phoneIsalndSizes, state])

  useEffect(() => {
    if (!hasInitialized.current)
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

  }, [hasInitialized.current])

  const resize = (size: Size, state: PhoneIslandData) => {
    if (!isOnLogout.current) {
      const { view } = state
      log(`RESIZE ${size.w}x${size.h} ${account?.username} ${view}`)
      if (view === PhoneIslandView.KEYPAD || view === PhoneIslandView.TRANSFER || state.currentCall.transferring) {
        phoneIslandContainer.current?.children[1].setAttribute('style', 'height: calc(100vh + 40px); position: relative;')
      } else if (view === PhoneIslandView.CALL) {
        phoneIslandContainer.current?.children[1].setAttribute('style', '')
      }
      window.api.resizePhoneIsland(size)
    }
  }

  const { createDataConfig, dispatchAndWait } = usePhoneIsland()
  useEffect(() => {
    if (account && !isDataConfigCreated.current) {
      createDataConfig(account).then(([deviceInformation, dataConfig]) => {
        setDeviceInformationObject(() => ({ ...deviceInformation }))
        setDataConfig(dataConfig)
        isDataConfigCreated.current = true
      }).catch((e) => {

      })
    }
  }, [account])

  useEffect(() => {
    if (account && dataConfig) {
      destroyAllListeners()
      setListeners((p) => {
        return {
          ...events
        }
      })
    }
  }, [dataConfig])

  useEffect(() => {
    if (account && Object.keys(listeners).length > 0 && !attachedListener.current) {
      log(account?.username, 'attachd listeners', Object.keys(listeners).length)
      Object.entries(listeners).forEach(([phoneIslandEventName, callback]) => {
        window.addEventListener(phoneIslandEventName, callback)
      })
      attachedListener.current = true
    }
  }, [account, listeners])

  const destroyAllListeners = () => {
    log(account?.username, 'deattached listeners', Object.keys(listeners).length)
    Object.entries(listeners).forEach(([phoneIslandEventName, callback]) => {
      window.removeEventListener(phoneIslandEventName, callback)
    })
    attachedListener.current = false
    setListeners(() => ({}))
  }

  async function logout() {
    isOnLogout.current = true
    log('LOGOUT', deviceInformationObject.current)
    if (deviceInformationObject.current) {
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-call-end'], PHONE_ISLAND_EVENTS['phone-island-call-ended'])
      log('completed phone-island-call-ended')
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-detach'], PHONE_ISLAND_EVENTS['phone-island-detached'], {
        data: {
          deviceInformationObject: deviceInformationObject.current
        }
      })
      log('detached and LOGOUT_COMPLETED')
    }
    setDataConfig(undefined)
    isDataConfigCreated.current = false
    destroyAllListeners()
    await delay(250)
    window.electron.send(IPC_EVENTS.LOGOUT_COMPLETED)
    log('LOGOUT_COMPLETED')
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


