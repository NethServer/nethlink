import { PhoneIsland } from '@nethesis/phone-island'
import { useInitialize } from '@renderer/hooks/useInitialize'
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
