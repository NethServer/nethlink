import { log } from '@shared/utils/logger'
import { useEffect, useRef } from 'react'

export function useInitialize(callback: () => void, emitCompletition = false) {
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      callback()
    }
  }, [])
}
