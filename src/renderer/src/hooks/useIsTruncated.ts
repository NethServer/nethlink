import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Detects whether the content of an element is visually truncated
 * (i.e. `scrollWidth > clientWidth`). Useful to attach a tooltip only
 * when the text is actually cut off.
 *
 * Recomputes on mount, on element resize (ResizeObserver) and whenever
 * one of the provided `deps` changes (e.g. the rendered text).
 *
 * @returns a tuple with the ref to attach to the element and the current
 * truncation flag.
 */
export function useIsTruncated<T extends HTMLElement = HTMLElement>(
  deps: unknown[] = [],
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps])

  return [ref, isTruncated]
}
