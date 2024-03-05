import { PhoneIsland } from '@nethesis/phone-island'
import { useEventListener } from '@renderer/hooks/useEventListeners'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { debouncer } from '@shared/utils/utils'
import { useState, useEffect, useRef } from 'react'

export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()
  const [isMouseOver, setIsMouseOver] = useState(false)
  const ref = useRef(0)

  useInitialize(() => {
    window.api.onDataConfigChange(updateDataConfig)
    window.api.onStartCall((number: number | string) => {
      debounceListener()
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

  useEffect(() => {
    debouncer('updateMouse', () => {
      window.api.emitMouseOverPhoneIsland(isMouseOver)
    }, 250)
    const root = document.getElementById('test')!
    root.className = isMouseOver ? root.className.replace('bg-green-500', 'bg-red-500') : root.className.replace('bg-red-500', 'bg-green-500')
  }, [isMouseOver])


  const getPhoneIslandElement = () => {
    return document.getElementById('phone-island-container')?.children[0]?.children[0] as HTMLDivElement | undefined
  }

  const addOverEvent = (element: HTMLDivElement) => {

    element.onmouseenter = (event) => {
      setIsMouseOver(true)
    }
    element.onmouseleave = (event) => {
      setIsMouseOver(false)
    }

    const interval = setInterval(() => {
      const el = getPhoneIslandElement()
      const eq = element === el
      console.log(eq, element, el)
      if (!eq) {
        clearInterval(interval)
        setIsMouseOver(false)
      }
    }, 1000)
  }

  const listenPhoneIsland = (stop = false) => {
    if (!stop) {
      setTimeout(() => {
        const elementToObserve = getPhoneIslandElement()
        console.log('DIV', elementToObserve)
        if (elementToObserve && elementToObserve.className.includes('pi-absolute')) {
          ref.current = 0
          addOverEvent(elementToObserve)
        } else {
          ref.current++
          listenPhoneIsland(ref.current > 10)
        }
      }, 250)
    } else {
      console.error('PHONE ISLAND NON TROVATA')
    }
  }



  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-started'], debounceListener)
  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-ringing'], debounceListener)
  useEventListener(PHONE_ISLAND_EVENTS['phone-island-call-ended'], () => {
    console.log("END CALL")
    setIsMouseOver(false)
  })

  function debounceListener() {
    debouncer('listenPhoneIsland', listenPhoneIsland, 100)
  }

  return (
    <div className="h-[100vh] w-[100vw] bg-[#ffffff60]" id="phone-island-container">
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
      <div id='test' className='h-[140px] w-[140px] relative top-[10px] left-[10px] bg-red-500'></div>
    </div>
  )
}
