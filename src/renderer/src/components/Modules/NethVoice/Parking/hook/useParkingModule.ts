import { useStoreState } from "@renderer/store"
import { ParkingType } from "@shared/types"
import { log } from "@shared/utils/logger"
import { difference, differenceBy, differenceWith } from "lodash"
import { useEffect, useState } from "react"

export const useParkingModule = () => {

  const [parkedCalls] = useStoreState<ParkingType[]>('parkings')
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
