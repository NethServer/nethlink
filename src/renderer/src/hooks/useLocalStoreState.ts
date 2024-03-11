import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { useSubscriber } from './useSubscriber'

export function useLocalStoreState<T>(
  selector: keyof LocalStorageData
): [T | undefined, (arg?: ((pre?: T) => T | undefined) | T) => void] {
  const store = useLocalStore()
  const subscribedData = useSubscriber<T>(selector)

  const setter = (newValue?: ((pre?: T) => T | undefined) | T) => {
    const o = store.getData(selector)()
    let v
    if (typeof newValue === 'function') {
      v = (newValue as (pre?: T) => T | undefined)(o)
    } else {
      v = newValue
    }
    store.setData(selector)(v)
  }

  return [subscribedData, setter]
}
