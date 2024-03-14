import { log } from '@shared/utils/logger'
import { useEffect, useRef } from 'react'

export function useInitialize(callback: () => void, emitCompletition = false) {
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      callback()
      if (emitCompletition) {
        let hash = window.location.hash.split('#/')
        if (hash.length === 1) {
          hash = window.location.hash.split('#')
        }
        const page = hash[1].split('/')[0]
        window.api.sendInitializationCompleted(page)
      }
    }
  }, [])
}
