import { PhoneIsland } from '@nethesis/phone-island'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import loadI18n from '@renderer/lib/i18n'
import { PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { useState, useEffect, useRef } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true)

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((number: number | string) => {
      window.api.showPhoneIsland()
      window.dispatchEvent(
        new CustomEvent('phone-island-call-start', {
          detail: {
            number
          }
        })
      )
    })
    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, () => {
        console.log('EVENT', event)
        if (event === PHONE_ISLAND_EVENTS['phone-island-call-ringing']) {
          window.api.showPhoneIsland()
        }
        if (event === PHONE_ISLAND_EVENTS['phone-island-call-ended']) {
          window.api.hidePhoneIsland()
        }
        if (PHONE_ISLAND_RESIZE(isCollapsed).has(event)) {
          console.log('EVENT RESIZE', event)
          const size = PHONE_ISLAND_RESIZE(isCollapsed).get(event)!
          window.api.resizePhoneIsland(size.w, size.h)
        }
      })
    })
  }, true)

  window.addEventListener(PHONE_ISLAND_EVENTS['phone-island-expanded'], () => {
    setIsCollapsed(false)
  })
  window.addEventListener(PHONE_ISLAND_EVENTS['phone-island-collapsed'], () => {
    setIsCollapsed(true)
  })

  function updateDataConfig(dataConfig: string | undefined) {
    setDataConfig(() => dataConfig)
  }

  function redirectEventToMain(event: PHONE_ISLAND_EVENTS) {
    //mi sottoscrivo all'evento che arriva sulla window della phone island
    useEventListener(event, (e) => {
      console.log(event, e)
      //giro l'evento al main di electron -> poi il main propaga l'evento alle altre window che avranno attivato il corrispondente listener
      window.api[event](e)
    })
  }

  redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-main-presence'])
  redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-conversations'])
  redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-queue-update'])
  redirectEventToMain(PHONE_ISLAND_EVENTS['phone-island-queue-member-update'])

  return (
    <div className="h-[100vh] w-[100vw] " id="phone-island-container">
      {dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoader={loadI18n} />}
    </div>
  )
}
