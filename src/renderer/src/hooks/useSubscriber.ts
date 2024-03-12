import { useEffect, useRef, useState } from 'react'
import { useInitialize } from './useInitialize'
import { LocalStorageData, useLocalStore } from '@renderer/store/StoreController'
import { log } from '@shared/utils/logger'

export function useSubscriber<T>(selector: keyof LocalStorageData) {
  const data = useLocalStore<T>((s) => s[selector])

  return data
}
