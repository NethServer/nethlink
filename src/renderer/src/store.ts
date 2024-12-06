import { FilterTypes, IPC_EVENTS, LoginPageSize, MENU_ELEMENT } from '@shared/constants';
import { LocalStorageData, LoginPageData, NethLinkPageData } from '@shared/types';
import { log } from '@shared/utils/logger';
import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware'
import { useInitialize } from './hooks/useInitialize';
import { usePageCtx } from './contexts/pageContext';

type SharedState<T> = {
  [Key in keyof T]: T[Key];
} & {
  setData: (key: keyof T, value: any) => T;
};

type CreateGlobalStateHook<T> = {
  useGlobalState: <Key extends keyof T>(key: Key) => [T[Key], (setter: ((previous: T[Key]) => T[Key]) | T[Key]) => void];
  useRegisterStoreHook: () => void
}

export function createGlobalStateHook<T>(globalStateDefaultObject: T, sharedWithBackend = false): CreateGlobalStateHook<T> {

  // @ts-ignore
  const useSharedStore = create<SharedState<T>>(devtools((set) => ({
    ...globalStateDefaultObject,
    setData: (key: keyof T, value: any) => set((state: any) => ({ ...state, [key]: typeof value === 'function' ? value(state[key]) : value }))
  })))

  function useGlobalState<Key extends keyof T>(
    key: Key
  ): [T[Key], (setter: ((previous: T[Key]) => T[Key]) | T[Key]) => void] {
    const value = useSharedStore((state: SharedState<T>) => state[key]);
    const setData = useSharedStore((state: SharedState<T>) => state.setData);
    const pageData = usePageCtx()

    const setValue = (arg0: ((prev: T[Key]) => T[Key]) | T[Key]) => {
      let state
      let updatedValue
      if (typeof arg0 === 'function') {
        // Gestione quando arg0 è una funzione updater
        state = setData(key, (prevValue: T[Key]) => {
          // Chiama la funzione arg0 con il valore precedente e aggiorna con il nuovo valore ritornato
          updatedValue = (arg0 as (prev: T[Key]) => T[Key])(prevValue);
          return updatedValue
        });
        //log('STORE update as func', state)

      } else {
        updatedValue = arg0
        // Gestione quando arg0 è un valore diretto
        state = setData(key, arg0);
        //log('STORE update directly', state)
      }

      if (sharedWithBackend) {
        const sharedStateCopy = Object.assign({}, state)
        log('STORE share state from', pageData?.page, { key: key })
        window.electron.send(IPC_EVENTS.UPDATE_SHARED_STATE, sharedStateCopy, pageData?.page, key);
      }
    };

    return [value, setValue];
  }

  const useRegisterStoreHook = () => {
    const pageData = usePageCtx()
    const setData = useSharedStore((state: SharedState<T>) => state.setData);
    const isRegistered = useRef(false)

    useEffect(() => {
      if (pageData && !isRegistered.current) {
        log('INFO shared state registered')
        isRegistered.current = true
        window.electron.receive(IPC_EVENTS.SHARED_STATE_UPDATED, (newStore: T, fromPage: string) => {
          if (fromPage !== pageData.page) {
            log('INFO shared state received from', fromPage)
            Object.keys(newStore as object).forEach((k: any) => {
              setData(k, newStore[k])
            })
          }
        })
        log('INFO shared state requested for the first time')
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
  auth: undefined,
  connection: undefined,
  lastCalls: undefined,
  lostCallNotifications: undefined,
  missedCalls: undefined,
  notifications: undefined,
  operators: undefined,
  page: undefined,
  parkings: undefined,
  queues: undefined,
  speeddials: undefined,
  theme: undefined
} as LocalStorageData, true)

export const useNethlinkData = createGlobalStateHook({
  selectedSidebarMenu: MENU_ELEMENT.FAVOURITES,
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
} as NethLinkPageData, true).useGlobalState

export const useLoginPageData = createGlobalStateHook({
  isLoading: false,
  selectedAccount: undefined,
  windowHeight: LoginPageSize.h
} as LoginPageData, true).useGlobalState


