import { PhoneIsland } from '@nethesis/phone-island'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { useState, useRef } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
  const isCollapsed = useRef<boolean>(true)

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((number: number | string) => {
      window.dispatchEvent(
        new CustomEvent(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
          detail: {
            number
          }
        })
      )
    })
    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, () => {
        console.log('EVENT', event)
        switch (event) {
          case PHONE_ISLAND_EVENTS['phone-island-call-ringing']:
            window.api.showPhoneIsland()
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ended']:
          case PHONE_ISLAND_EVENTS['phone-island-call-parked']:
          case PHONE_ISLAND_EVENTS['phone-island-call-transfered']:
            window.api.hidePhoneIsland()
            break
        }
        if (PHONE_ISLAND_RESIZE.has(event)) {
          console.log('EVENT RESIZE', event)
          const size = PHONE_ISLAND_RESIZE.get(event)!(isCollapsed.current)
          window.api.resizePhoneIsland(size.w, size.h)
        }
      })
    })
  }, true)

  window.addEventListener(PHONE_ISLAND_EVENTS['phone-island-call-actions-opened'], () => {
    isCollapsed.current = false
  })
  window.addEventListener(PHONE_ISLAND_EVENTS['phone-island-call-actions-closed'], () => {
    isCollapsed.current = true
  })

  function updateDataConfig(dataConfig: string | undefined) {
    if (!dataConfig) {
      window.dispatchEvent(new CustomEvent(PHONE_ISLAND_EVENTS['phone-island-call-end']))
    }
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

  const loadPath = getI18nLoadPath()

  return (
    <div className="absolute top-0 left-0 h-[100vh] w-[100vw] z-[9999] " id="phone-island-container">
      <div className='absolute h-[100vh] w-[100vw] bg-green-500/30 radius-md backdrop-hue-rotate-90'>
      </div>
      {dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={loadPath} />}
    </div>
  )
}
