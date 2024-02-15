import { PhoneIsland } from "@nethesis/phone-island";
import { useInitialize } from "@renderer/hooks/useInitialize";
import { IPC_EVENTS } from "@shared/constants";
import { useState } from "react";
import { useLocation } from "react-router-dom";


export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()

  const locationDom = useLocation()
  useInitialize(() => {
    const data = locationDom.search.split('dataConfig=')[1]
    console.log(data)
    setDataConfig(() => data)

    window.api.onStartCall((e, phoneNumber) => {
      console.log('received number', phoneNumber)
      window.dispatchEvent(new CustomEvent('phone-island-call-start', {
        detail: {
          number: phoneNumber
        }
      }))
    })
  })

  return <div id={'draggable-phone-island'} className="h-[100vh] w-[100vw] *:bg-slate-50">
    {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
  </div>
}
