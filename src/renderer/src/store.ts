import { IPC_EVENTS } from '@shared/constants';
import { LocalStorageData } from '@shared/types';
import { log } from '@shared/utils/logger';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isEqual } from 'lodash'
import { StoreApi, create } from 'zustand';
import { useInitialize } from './hooks/useInitialize';
import { isDeepEqual } from '@shared/utils/utils';
import { PageCtx, usePageCtx } from './contexts/pageContext';
interface SharedState {
  sharedState: LocalStorageData;
  setData: (data) => void,
  // useSharedState: <T>(selector: keyof LocalStorageData) => [T | undefined, (arg0: T | ((ex: T) => T | undefined) | undefined) => void],
}


const initialData: LocalStorageData = {}
const useSharedStore = create<SharedState>((set) => {
  return {
    sharedState: {
      ...initialData
    },
    setData: (newValue) => set((state) => ({
      sharedState: {
        ...state.sharedState,
        ...newValue,
      },
    })),
  }
})

export const useRegisterStoreHook = () => {
  const { sharedState, setData } = useSharedStore();
  const isRegistered = useRef(false)

  useInitialize(() => {
    if (!isRegistered.current) {
      isRegistered.current = true
      window.electron.receive(IPC_EVENTS.SHARED_STATE_UPDATED, (newStore: LocalStorageData, fromPage: string) => {
        log("RECEIVED UPDATE STORE", fromPage, newStore)
        Object.keys(newStore).forEach((k) => {
          sharedState[k] = newStore[k]
        })
        setData(sharedState)
      })
    }
  });

  return sharedState

}

export function useStoreState<T>(selector: keyof LocalStorageData): [T | undefined, (arg0: T | ((ex: T) => T | undefined) | undefined) => void] {

  const { setData } = useSharedStore()
  const sharedState = useSharedStore(s => s.sharedState)

  const useSharedState = <T>(selector: keyof LocalStorageData): [(T | undefined), ((arg0: T | ((ex: T) => T | undefined) | undefined) => void)] => {
    const getter = useSharedStore(s => s.sharedState[selector]) as T | undefined
    const pageData = usePageCtx()

    const setter = (arg0: (T | undefined) | ((ex: T) => T | undefined)) => {
      let v: T | undefined = arg0 as (T | undefined)
      if (typeof arg0 === 'function') {
        v = (arg0 as (ex: T | undefined) => T | undefined)(getter as T | undefined)
      }
      sharedState[selector] = v as any
      setData(sharedState)
      const sharedStateCopy = Object.assign({}, sharedState)
      window.electron.send(IPC_EVENTS.UPDATE_SHARED_STATE, sharedStateCopy, pageData?.page, selector);
    }

    return [getter, setter]
  }

  return useSharedState(selector)
}



