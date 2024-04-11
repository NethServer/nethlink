import { PhoneIsland } from '@nethesis/phone-island'
import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { Account, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { useState, useRef, useMemo, useCallback, createRef } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
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
          //log('EVENT RESIZE', event)
          //sono sicuro di avere l'evento. il controllo l'ho fatto con .has(event)

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
    //log('UPDATE DATA CONFIG')
    if (!dataConfig) {
      //se non ho il data config sto effettuando un logout
      //const deviceInformationObject = account.data?.endpoints.extension.find((e) => e.type === 'webrtc')
      //log(deviceInformationObject)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-end'])
      // eventDispatch(PHONE_ISLAND_EVENTS['phone-island-detach'], {
      //   deviceInformationObject
      // })
    }
    setDataConfig(() => dataConfig)
  }

  function redirectEventToMain(event: PHONE_ISLAND_EVENTS) {
    //mi sottoscrivo all'evento che arriva sulla window della phone island
    useEventListener(event, (e) => {
      //log(event, e)
      //giro l'evento al main di electron -> poi il main propaga l'evento alle altre window che avranno attivato il corrispondente listener
      window.api[event](e)
    })
  }

  // redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-main-presence'])
  // redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-conversations'])
  // redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-queue-update'])
  // redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-queue-member-update'])

  Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => redirectEventToMain(ev as PHONE_ISLAND_EVENTS))

  const RenderPhoneIsland = useCallback(() => {
    //log("PHONE ISLAND RENDERER", dataConfig)
    return dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={loadPath.current} />
  }, [dataConfig])

  return (
    <div
      ref={phoneIslandContainer}
      className="absolute top-0 left-0 h-[100vh] w-[100vw] z-[9999]"
      id="phone-island-container"
    >
      <div className="absolute h-[100vh] w-[100vw] bg-green-500/30 radius-md backdrop-hue-rotate-90"></div>
      <RenderPhoneIsland />
    </div>
  )
}
