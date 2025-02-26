
/**
 *  This file is an adaptation of the AIDAPT open library @aidapt/global-state for this project.
 *  https://www.npmjs.com/package/@aidapt/global-state
 */

import { FilterTypes, IPC_EVENTS, LoginPageSize, MENU_ELEMENT } from '@shared/constants';
import { LocalStorageData, LoginPageData, NethLinkPageData } from '@shared/types';
import { Log } from '@shared/utils/logger';
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware'
import { usePageCtx } from './contexts/pageContext';

type SharedState<T> = {
  data: {
    [Key in keyof T]: T[Key];
  },
  setData: (key: keyof T, value: any) => T;
};

type CreateGlobalStateHook<T> = {
  useGlobalState: <Key extends keyof T>(key: Key) => [T[Key], (setter: ((previous: T[Key]) => T[Key]) | T[Key]) => void];
  useRegisterStoreHook: () => void
}

export function createGlobalStateHook<T>(globalStateDefaultObject: T, sharedWithBackend = false): CreateGlobalStateHook<T> {

  // @ts-ignore
  const useSharedStore = create<SharedState<T>>(devtools((set) => ({
    data: {
      ...globalStateDefaultObject,
    },
    setData: (key: keyof T, value: any) => {
      let newState
      set((state: SharedState<T>) => {
        let res: T | undefined = typeof value === 'function'
          ? value(state.data[key])
          : value
        newState = {
          setData: state.setData,
          data: {
            ...state.data,
            [key]: res
          }
        }
        return newState
      })
      return newState.data
    }
  })))

  function useGlobalState<Key extends keyof T>(
    key: Key
  ): [T[Key], (setter: ((previous: T[Key]) => T[Key]) | T[Key]) => void] {
    //const global = useSharedStore((state: SharedState<T>) => state.data);
    const value = useSharedStore((state: SharedState<T>) => state.data[key]);
    const setData = useSharedStore((state: SharedState<T>) => state.setData);
    const pageData = usePageCtx()

    const setValue = (arg0: ((prev: T[Key]) => T[Key]) | T[Key]) => {
      let global: T
      if (typeof arg0 === 'function') {
        global = setData(key, (prevValue: T[Key]) => {
          return (arg0 as (prev: T[Key]) => T[Key])(prevValue);
        });

      } else {
        global = setData(key, arg0);
      }

      if (pageData?.page && sharedWithBackend) {
        const sharedStateCopy = Object.assign({}, global)
        Log.debug('STORE share state from', pageData?.page, { key: key })
        window.electron.send(IPC_EVENTS.UPDATE_SHARED_STATE, sharedStateCopy, pageData.page, key);
      }
    };

    return [value, setValue];
  }

  const useRegisterStoreHook = () => {
    const pageData = usePageCtx()
    const setData = useSharedStore((state: SharedState<T>) => state.setData);
    //const global = useSharedStore((state: SharedState<T>) => state.data);
    const isRegistered = useRef(false)

    useEffect(() => {
      if (pageData && !isRegistered.current) {
        Log.debug('shared state registered')
        isRegistered.current = true
        window.electron.receive(IPC_EVENTS.SHARED_STATE_UPDATED, (newStore: T, fromPage: string) => {
          if (fromPage !== pageData.page) {
            Log.debug('shared state received from', fromPage)
            Object.keys(newStore as object).forEach((k: any) => {
              setData(k, newStore[k])
              //global[k] = newStore[k]
            })
          }
        })
        Log.debug('shared state requested for the first time')
        window.electron.send(IPC_EVENTS.REQUEST_SHARED_STATE);
      }
    }, [pageData]);
  }

  return {
    useGlobalState,
    useRegisterStoreHook
  }
}
export const {
  useGlobalState: useSharedState,
  useRegisterStoreHook
} = createGlobalStateHook({
  account: undefined,
  device: undefined,
  auth: undefined,
  connection: undefined,
  lostCallNotifications: undefined,
  notifications: undefined,
  page: undefined,
  theme: undefined
} as LocalStorageData, true)

export const useNethlinkData = createGlobalStateHook({
  selectedSidebarMenu: MENU_ELEMENT.FAVOURITES,
  lastCalls: undefined,
  speeddials: undefined,
  missedCalls: undefined,
  operators: undefined,
  queues: undefined,
  parkings: undefined,
  isForwardDialogOpen: false,
  phonebookModule: {
    selectedContact: undefined
  },
  speeddialsModule: {
    selectedSpeedDial: undefined,
    selectedFavourite: undefined,
    favouriteOrder: FilterTypes.AZ

  },
  phonebookSearchModule: {
    searchText: null
  },
  showAddContactModule: false,
  showPhonebookSearchModule: false
} as NethLinkPageData).useGlobalState

export const useLoginPageData = createGlobalStateHook({
  isLoading: false,
  selectedAccount: undefined,
  windowHeight: LoginPageSize.h
} as LoginPageData).useGlobalState


