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

    const events = [
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      PHONE_ISLAND_EVENTS['phone-island-conversations'],
      PHONE_ISLAND_EVENTS['phone-island-queue-update'],
      PHONE_ISLAND_EVENTS['phone-island-queue-member-update'],
      PHONE_ISLAND_EVENTS['phone-island-user-already-login'],
      PHONE_ISLAND_EVENTS['phone-island-server-reloaded'],
      PHONE_ISLAND_EVENTS['phone-island-server-disconnected'],
      PHONE_ISLAND_EVENTS['phone-island-socket-disconnected'],
      PHONE_ISLAND_EVENTS['phone-island-parking-update'],
    ]
    events.forEach((e) => {
      //console.log('register', e, window.api[e])
      window.addEventListener(e, (ev) => window.api[e](ev['detail']))

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

