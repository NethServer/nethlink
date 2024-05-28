import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { useSubscriber } from './useSubscriber'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { log } from '@shared/utils/logger'

export function useLocalStoreState<T>(
  selector: keyof LocalStorageData
): [T | undefined, (newValue?: T) => void, MutableRefObject<T | undefined>] {
  const subscribedDataRef = useRef<T>()
  const store = useLocalStore()
  const subscribedData = useSubscriber<T>(selector)
  const setter = (newValue) => {
    if (typeof newValue == 'object') {
      newValue = Object.assign({}, newValue)
    }
    store.setData(selector)(newValue)
    subscribedDataRef.current = newValue
  }

  return [subscribedData, setter, subscribedDataRef]
}
