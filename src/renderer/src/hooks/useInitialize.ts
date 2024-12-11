import { useEffect, useRef } from 'react'

export function useInitialize(callback: () => void) {
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      callback()
    }
  }, [])
}
