import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'

export function useSubscriber<T>(selector: keyof LocalStorageData) {
  const data = useLocalStore<T>((s) => s[selector])

  return data
}
