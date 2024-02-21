import { useEffect, useRef } from 'react'

export function useInitialize(callback: () => void, emitCompletition = false) {
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      callback()
      if (emitCompletition) {
        const page = window.location.hash.split('#/')[1].split('/')[0]
        window.api.sendInitializationCompleted(page)
      }
    }
  }, [])
}
