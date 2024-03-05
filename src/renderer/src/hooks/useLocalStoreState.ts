import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { useSubscriber } from './useSubscriber'

export function useLocalStoreState<T>(
  selector: keyof LocalStorageData
): [T, (pre: any) => any | any] {
  const store = useLocalStore()
  const subscribedData = useSubscriber<T>(selector)
  const setter = (newValue: (pre: any) => any | any) => {
    const o = store.getData(selector)()
    let v
    if (typeof newValue === 'function') {
      v = newValue(o)
    } else {
      v = newValue
    }
    store.setData(selector)(v)
  }

  return [subscribedData, setter]
}
