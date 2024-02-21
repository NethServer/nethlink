import { PhoneIsland } from '@nethesis/phone-island'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { createRef, useEffect, useRef, useState } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((number: number | string) => {
      console.log('received number', number)
      window.dispatchEvent(
        new CustomEvent('phone-island-call-start', {
          detail: {
            number
          }
        })
      )
    })

    Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
      window.addEventListener(ev, (event) => window.api[ev](event['detail']))
    })
  }, true)

  function updateDataConfig(e, dataConfig: string | undefined) {
    console.log(dataConfig)
    setDataConfig(() => dataConfig)
  }

  const ref = createRef<HTMLDivElement>()
  const initialize = useRef<boolean>(false)
  useEffect(() => {
    if (ref.current && !initialize.current) {
      initialize.current = true
      const elementToObserve = ref.current

      const observer = new MutationObserver(function (mutationsList, observer) {
        const elem = mutationsList[0].target as HTMLDivElement
        console.log(elem)
        if (elem.className.includes('pi-pointer-events-auto')) {
          if (elem.offsetHeight <= 103) {
            window.api.resizePhoneIsland(420, 98)
          } else if (elem.offsetHeight > 103 && elem.offsetHeight <= 237) {
            window.api.resizePhoneIsland(350, 238)
          } else if (elem.offsetHeight > 237) {
            window.api.resizePhoneIsland(350, 306)
          }
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
    <div className="h-[100vh] w-[100vw]" ref={ref}>
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
    </div>
  )
}
