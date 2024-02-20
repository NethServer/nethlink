import { PhoneIsland } from '@nethesis/phone-island'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { useState } from 'react'

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

  return (
    <div className="bg-white h-full w-full">
      {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
    </div>
  )
}

