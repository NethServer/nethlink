import { PhoneIsland } from '@nethesis/phone-island'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { createRef, useEffect, useRef, useState } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((e, phoneNumber) => {
      console.log('received number', phoneNumber)
      window.dispatchEvent(
        new CustomEvent('phone-island-call-start', {
          detail: {
            number: phoneNumber
          }
        })
      )
    })

    console.log(window.api)

    Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
      window.addEventListener(ev, (event) => window.api[ev](event['detail']))
    })
  })

  function updateDataConfig(e, dataConfig: string | undefined) {
    console.log(dataConfig)
    setDataConfig(() => dataConfig)
  }

  const ref = createRef<HTMLDivElement>()
  const initialize = useRef<boolean>(false)
  useEffect(() => {
    if (ref.current && !initialize.current) {
      initialize.current = true
      console.log('ciao')
      const elementToObserve = ref.current

      const observer = new MutationObserver(function (mutationsList, observer) {
        const elem = mutationsList[0].target as HTMLDivElement
        if (elem.className.includes('pi-pointer-events-auto')) {
          console.log(elem)
          console.log(elem.offsetWidth, elem.offsetHeight)
          window.api.resizePhoneIsland(elem.offsetWidth, elem.offsetHeight)
        } else if (elem.className.includes('hidden')) {
          window.api.resizePhoneIsland(0, 0)
        }
      })

      observer.observe(elementToObserve, {
        characterData: false,
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style']
      })
    }
  }, [ref.current])

  return (
    <div className="bg-white h-[100vh] w-[100vw]" ref={ref}>
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
    </div>
  )
}
