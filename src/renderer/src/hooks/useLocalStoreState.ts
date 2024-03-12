import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { useSubscriber } from './useSubscriber'
import { MutableRefObject } from 'react'
import { log } from '@shared/utils/logger'

export function useLocalStoreState<T>(
  selector: keyof LocalStorageData
): [T | undefined, (newValue?: T) => void] {
  const store = useLocalStore()
  const subscribedData = useSubscriber<T>(selector)
  const setter = (newValue) => {
    log('set new value of', selector, newValue)
    store.setData(selector)(newValue)
  }

  return [subscribedData, setter]
}
