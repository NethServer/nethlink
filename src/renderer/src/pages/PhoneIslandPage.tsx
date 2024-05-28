import { PhoneIsland } from '@nethesis/phone-island'
import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { Account, Extension, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { isDev } from '@shared/utils/utils'
import { useState, useRef, useMemo, useCallback, createRef } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
  const isOnCall = useRef<boolean>(false)
  const isExpanded = useRef<boolean>(true)
  const lastResizeEvent = useRef<PHONE_ISLAND_EVENTS>()
  const isMinimized = useRef<boolean>(false)
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)

  useInitialize(() => {
    loadPath.current = getI18nLoadPath()
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((number: number | string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.addEventListener(PHONE_ISLAND_EVENTS['phone-island-user-already-login'], () => {
      window.api.logout()
    })
    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, () => {
        log('EVENT', event)
        switch (event) {
          case PHONE_ISLAND_EVENTS['phone-island-call-ringing']:
            window.api.showPhoneIsland()
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ended']:
          case PHONE_ISLAND_EVENTS['phone-island-call-parked']:
          case PHONE_ISLAND_EVENTS['phone-island-call-transfered']:
            log(event)
            window.api.hidePhoneIsland()
            isOnCall.current = false
            break
          case PHONE_ISLAND_EVENTS['phone-island-expanded']:
            log(lastResizeEvent.current)
            isMinimized.current = false
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                window.api.resizePhoneIsland(previouEventSize.w, previouEventSize.h)
            }
            break
          case PHONE_ISLAND_EVENTS['phone-island-compressed']:
            isMinimized.current = true
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                window.api.resizePhoneIsland(previouEventSize.w, previouEventSize.h)
            }
            break
        }
        if (PHONE_ISLAND_RESIZE.has(event)) {
          switch (event) {
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-opened']:
              isExpanded.current = false
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-closed']:
              isExpanded.current = true
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-keypad-opened']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'padding-top: 40px')
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-transfer-opened']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'padding-top: 40px')
              break
            default:
              phoneIslandContainer.current?.children[1].setAttribute('style', '')
              break
          }
          if (event === PHONE_ISLAND_EVENTS['phone-island-call-ringing']) {
            if (!isOnCall.current) {
              isOnCall.current = true
            } else {
              return
            }
          }
          const size = getSizeFromResizeEvent(event)!
          window.api.resizePhoneIsland(size.w, size.h)
        }
      })
    })
  }, true)

  function getSizeFromResizeEvent(event: string): Size | undefined {
    const resizeEvent = PHONE_ISLAND_RESIZE.get(event)
    if (resizeEvent) {
      if (event !== PHONE_ISLAND_EVENTS['phone-island-compressed'])
        lastResizeEvent.current = event as PHONE_ISLAND_EVENTS
      const size = resizeEvent(isExpanded.current, isMinimized.current)
      return size
    }
    return undefined
  }

  function updateDataConfig(dataConfig: string | undefined, account: Account) {
    if (!dataConfig) {
      //if I don't have the data config I am logging out
      const deviceInformationObject = account.data?.endpoints.extension.find((e) => e.type === 'nethlink')
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-end'])
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-detach'], {
        deviceInformationObject
      })
    } else {
      const endpoints = account.data?.endpoints
      if (endpoints?.extension) {
        //retrive the default information about the extension of nethlink type
        //if main device setted to webrtc we must change it to nethlink
        //launch events to change default device type
        const nethlinkData = endpoints?.extension.filter((phone) => phone?.type === 'nethlink')
        if (account?.data?.default_device?.type !== 'nethlink') {
          log('phone-island-default-device-change')
          setMainDeviceId(nethlinkData[0])
        }
      }
    }
    setDataConfig(() => dataConfig)
  }

  const setMainDeviceId = async (deviceInformationObject: Extension | null) => {
    if (deviceInformationObject) {
      try {
        await window.api.deviceDefaultChange(deviceInformationObject)
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-default-device-change'], { deviceInformationObject })
      } catch (err) {
        log(err)
      }
    }
  }

  function redirectEventToMain(event: PHONE_ISLAND_EVENTS) {
    //I subscribe to the event coming on the phone island window
    useEventListener(event, (e) => {
      //I turn the event to the electron main -> then the main propagates the event to the other windows that will have triggered the corresponding listener
      window.api[event](e)
    })
  }

  Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => redirectEventToMain(ev as PHONE_ISLAND_EVENTS))

  const RenderPhoneIsland = useCallback(() => {
    return dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={loadPath.current} uaType='mobile' />
  }, [dataConfig])

  return (
    <div
      ref={phoneIslandContainer}
      className={`absolute top-0 left-0 h-[100vh] w-[100vw] z-[9999] ${isDev() ? 'bg-red-700' : ''}`}
    >
      <div className="absolute h-[100vh] w-[100vw]  radius-md backdrop-hue-rotate-90"></div>
      <RenderPhoneIsland />
    </div>
  )
}
