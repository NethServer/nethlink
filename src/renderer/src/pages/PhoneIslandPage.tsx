import { PhoneIsland } from "@nethesis/phone-island";
import { useInitialize } from "@renderer/hooks/useInitialize";
import { useState } from "react";
import { useLocation } from "react-router-dom";


export function PhoneIslandPage() {
  const [dataConfig, setDataConfig] = useState<string | undefined>()

  const locationDom = useLocation()
  useInitialize(() => {
    const data = locationDom.search.split('dataConfig=')[1]
    console.log(data)
    setDataConfig(() => data)
    document.getElementById('draggable-phone-island')?.addEventListener('change', (e) => {
      console.log(e)
    })
  })

  return <div id={'draggable-phone-island'} className="bg-slate-50">
    {dataConfig && <PhoneIsland dataConfig={dataConfig} />}
  </div>
}
