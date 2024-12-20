import { useNethlinkData } from "@renderer/store"
import { ParkingType } from "@shared/types"
import { useEffect, useState } from "react"

export const useParkingModule = () => {

  const [parkedCalls] = useNethlinkData('parkings')
  const [validParkedCalls, setValidParkedCalls] = useState<ParkingType[] | undefined>(undefined)
  useEffect(() => {
    parkedCalls && extractValidParkedCalls(parkedCalls)
  }, [parkedCalls])


  const extractValidParkedCalls = (parkedCalls: ParkingType[]) => {

    setValidParkedCalls(() => [
      ...(parkedCalls?.filter((p) => !!p.parkedCaller.name) || []),
    ]
    )
  }


  return {
    parkedCalls: validParkedCalls,
  }
}
