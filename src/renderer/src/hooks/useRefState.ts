import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react"

export const useRefStat = <T>(targetState: [T | undefined, Dispatch<SetStateAction<T | undefined>>]): [MutableRefObject<T | undefined>, (arg0: T | ((ex: T) => T | undefined) | undefined) => void] => {
  const stateRef = useRef(targetState[0])

  useEffect(() => {
    if (stateRef.current !== targetState[0])
      stateRef.current = targetState[0]
  }, [targetState[0]])

  const setStateRef = (arg0: (T | undefined) | ((ex: T) => T | undefined)) => {
    let v: T | undefined = arg0 as (T | undefined)
    if (typeof arg0 === 'function') {
      v = (arg0 as (ex: T | undefined) => T | undefined)(stateRef.current as T | undefined)
    }
    stateRef.current = v
    targetState[1](v)
  }

  return [
    stateRef,
    setStateRef
  ]
}
