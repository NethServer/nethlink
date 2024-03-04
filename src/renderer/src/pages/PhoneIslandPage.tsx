import { PhoneIsland } from '@nethesis/phone-island'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { useState } from 'react'

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
  }, true)

  function updateDataConfig(dataConfig: string | undefined) {
    console.log(dataConfig)
    setDataConfig(() => dataConfig)
  }

  const listenPhoneIsland = () => {
    const phoneIslandContainer = document.getElementById('phone-island-container')?.children[0]
    const elementToObserve = phoneIslandContainer?.children[0]
    setTimeout(() => {
      console.log('DIV', elementToObserve)
      // elementToObserve.onmouseenter = () => {
      //   window.api.onMouseOverPhoneIsland(true)
      // }
      // elementToObserve.onmouseleave = () => {
      //   window.api.onMouseOverPhoneIsland(false)
      // }
      elementToObserve!.addEventListener('mouseenter', (event) => {
        console.log('is Over')
        window.api.onMouseOverPhoneIsland(true)
      })
      elementToObserve!.addEventListener('mouseleave', (event) => {
        console.log('is Not Over')
        window.api.onMouseOverPhoneIsland(false)
      })
    }, 1000)
  }

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((phoneNumber) => {
      console.log('received number', phoneNumber)
      window.dispatchEvent(
        new CustomEvent('phone-island-call-start', {
          detail: {
            number: phoneNumber
          }
        })
      )
    })
  }, true)

  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-started'], () => {
    setTimeout(() => {
      listenPhoneIsland()
    }, 1000)
  })
  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-ringing'], () => {
    setTimeout(() => {
      listenPhoneIsland()
    }, 1000)
  })
  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-ended'], () => {
    window.api.onMouseOverPhoneIsland(true)
  })

  return (
    <div className="h-[100vh] w-[100vw]" id="phone-island-container">
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
    </div>
  )
}
