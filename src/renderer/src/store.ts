import { IPC_EVENTS } from '@shared/constants';
import { LocalStorageData } from '@shared/types';
import { log } from '@shared/utils/logger';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isEqual } from 'lodash'
import { StoreApi, create } from 'zustand';
import { useInitialize } from './hooks/useInitialize';
import { isDeepEqual } from '@shared/utils/utils';
import { PageCtx, usePageCtx } from './contexts/pageContext';
type SharedState = {
  [selector in keyof LocalStorageData]: any;
} & {
  setData: (selector: keyof LocalStorageData, data) => LocalStorageData;
};


const useSharedStore = create<SharedState>((set, state) => {
  return {
    setData: (selector, newValue) => {
      set((state) => ({
        ...state,
        [selector]: newValue,
      })
      )
      const data: Partial<SharedState> = Object.assign({}, state())
      delete data.setData
      return data
    },
  }
})

export const useRegisterStoreHook = () => {
  const setData = useSharedStore(s => s.setData);
  const isRegistered = useRef(false)

  useInitialize(() => {
    if (!isRegistered.current) {
      isRegistered.current = true
      window.electron.receive(IPC_EVENTS.SHARED_STATE_UPDATED, (newStore: LocalStorageData, fromPage: string) => {
        Object.keys(newStore).forEach((k: any) => {
          setData(k, newStore[k])
        })
      })
    }
  });
}

export function useStoreState<T>(selector: keyof LocalStorageData): [T | undefined, (arg0: T | ((ex: T) => T | undefined) | undefined) => void] {

  const setData = useSharedStore(s => s.setData)

  const useSharedState = <T>(selector: keyof LocalStorageData): [(T | undefined), ((arg0: T | ((ex: T) => T | undefined) | undefined) => void)] => {
    const getter = useSharedStore(s => s[selector]) as T | undefined
    const pageData = usePageCtx()

    const setter = (arg0: (T | undefined) | ((ex: T) => T | undefined)) => {
      let v: T | undefined = arg0 as (T | undefined)
      if (typeof arg0 === 'function') {
        v = (arg0 as (ex: T | undefined) => T | undefined)(getter as T | undefined)
      }
      const sharedState = setData(selector, v)
      const sharedStateCopy = Object.assign({}, sharedState)
      window.electron.send(IPC_EVENTS.UPDATE_SHARED_STATE, sharedStateCopy, pageData?.page, selector);
    }

    return [getter, setter]
  }

  return useSharedState(selector)
}



