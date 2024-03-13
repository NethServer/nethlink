import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { useSubscriber } from './useSubscriber'
import { MutableRefObject, useEffect, useRef } from 'react'
import { log } from '@shared/utils/logger'

export function useLocalStoreState<T>(
  selector: keyof LocalStorageData
): [T | undefined, (newValue?: T) => void, MutableRefObject<T | undefined>] {
  const subscribedDataRef = useRef<T>()
  const store = useLocalStore()
  const subscribedData = useSubscriber<T>(selector)
  const setter = (newValue) => {
    log('set new value of', selector, newValue)
    store.setData(selector)(newValue)
    subscribedDataRef.current = newValue
  }

  useEffect(() => {
    log(subscribedDataRef.current)
  }, [subscribedDataRef.current])

  return [subscribedData, setter, subscribedDataRef]
}
