import { PhoneIsland } from '@nethesis/phone-island'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useLocalStoreState } from '@renderer/hooks/useLocalStoreState'
import { Account } from '@shared/types'
import { PHONE_ISLAND_EVENTS, PHONE_ISLAND_SIZES } from '@shared/constants'
import { createRef, useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
  const [loggedAccount, setLoggedAccount] = useLocalStoreState<Account | undefined>('user')

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

    window.api.onAccountChange((account: Account | undefined) => {
      console.log('account change', account)
      if (!account) {
        console.log(loggedAccount)
        // window.dispatchEvent(
        //   new CustomEvent('phone-island-detach', {
        //     detail: {
        //       number
        //     }
        //   })
        // )
      }
      setLoggedAccount(account)
    })

    console.log('INITIALIZE')
    Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
      window.addEventListener(ev, (event) => {
        window.api[ev](event['detail'])
      })
    })
  }, true)

  function updateDataConfig(dataConfig: string | undefined) {
    console.log(dataConfig)
    setDataConfig(() => dataConfig)
  }

  function resizeThisWindow(size: { w: number; h: number }) {
    window.api.resizePhoneIsland(size.w, size.h)
  }

  // non tutti gli eventi vengono emessi e ci sono troppe casistiche particolari
  function setListeners() {
    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, () => {
        console.log('prova', event)
        if (PHONE_ISLAND_SIZES.has(event)) {
          console.log('resize', event)
          //resizeThisWindow(PHONE_ISLAND_SIZES.get(event)!)
        }
      })
    })
  }

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    // Opzione uno
    setListeners()
  }, true)

  const ref = createRef<HTMLDivElement>()
  const initialize = useRef<boolean>(false)
  useEffect(() => {
    if (ref.current && !initialize.current) {
      initialize.current = true
      const elementToObserve = ref.current

      const observer = new MutationObserver(function (mutationsList, observer) {
        const elem = mutationsList[0].target as HTMLDivElement
        elem.className = `${elem.className} phone-island-id`
        // Opzione due
        //resizeThisWindow({ w: elem.offsetWidth, h: elem.offsetHeight })

        /*
        window.addEventListener('mousemove', (event) => {
          console.log(elem && elem.contains(event.target as Node))
          if (elem && elem.contains(event.target as Node)) {
            window.api.onMouseOverPhoneIsland(true)
          } else {
            window.api.onMouseOverPhoneIsland(false)
          }
        })
        */
        const phoneIslandElement = document.getElementsByClassName('phone-island-id')
        for (let i = 0; i < phoneIslandElement.length; i++) {
          ; (phoneIslandElement.item(i) as HTMLDivElement)?.addEventListener(
            'mouseenter',
            (event) => {
              console.log('is Over')
              window.api.onMouseOverPhoneIsland(true)
            }
          )
            ; (phoneIslandElement.item(i) as HTMLDivElement)?.addEventListener(
              'mouseleave',
              (event) => {
                console.log('is NOT Over')
                window.api.onMouseOverPhoneIsland(false)
              }
            )
        }
      })

      observer.observe(elementToObserve, {
        characterData: true,
        subtree: true,
        childList: false,
        attributes: true,
        attributeFilter: ['style']
      })
    }
  }, [ref.current])

  // Opzione uno: listeners per ogni evento e resize di conseguenza con misure fisse
  // Opzione due: observer continuo che ad ogni cambiamento dell'elemento dentro la ref fa il resize
  // Opzione tre: finestra grossa come tutto lo schermo che si crea quando arriva la chiamata

  return (
    <div className="h-[100vh] w-[100vw]" ref={ref}>
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
    </div>
  )
}
