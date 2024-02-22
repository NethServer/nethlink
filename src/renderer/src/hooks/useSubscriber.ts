import { useState } from 'react'
import { useInitialize } from './useInitialize'
import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'

export const useSubscriber = (selector: keyof LocalStorageData) => {
  const [data, setData] = useState({})

  useInitialize(() => {
    const clearSubscription = useLocalStore.subscribe((s) => {
      setData(s[selector])
    })
    return () => {
      clearSubscription()
    }
  })

  return data
}
