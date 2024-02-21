import { subscribe } from 'diagnostics_channel'
import { read } from 'fs'
import { createStore } from 'zustand/vanilla'

type LocalStorageData = {
  operators: {}
  profilePicture: {}
  customerCards: {}
  speedDial: {}
  toast: {}
  user: {}
  park: {}
  notifications: {}
  userActions: {}
  globalSearch: {}
  queues: {}
  queueManagerQueues: {}
  ctiStatus: {}
  sideDrawer: {}
  lines: {}
  lastCalls: {}
  darkTheme: {}
  phoneLines: {}
  authentication: {}
}

type LocalStorageState = {
  readonly setData: (key: keyof LocalStorageData) => (value: any) => void
} & LocalStorageData

const initialData: LocalStorageData = {
  operators: {},
  profilePicture: {},
  customerCards: {},
  speedDial: {},
  toast: {},
  user: {},
  park: {},
  notifications: {},
  userActions: {},
  globalSearch: {},
  queues: {},
  queueManagerQueues: {},
  ctiStatus: {},
  sideDrawer: {},
  lines: {},
  lastCalls: {},
  darkTheme: {},
  phoneLines: {},
  authentication: {}
}
const localStore = createStore<LocalStorageState>((set) => ({
  ...initialData,
  setData: (key: keyof LocalStorageData) => (value: any | any[]) =>
    set((store: LocalStorageState) => ({
      ...store,
      [key]: value
    }))
}))

type StoreData = {
  readonly get: () => any
  readonly set: (v: any) => void
}
type Store = Record<keyof LocalStorageData, StoreData>

export const store: Store = Object.keys(initialData).reduce<Store>((p, c) => {
  const s = localStore.getState()
  const e = {
    get: () => s[c],
    set: (v: any) => {
      s[c] = v
      console.log('update c', v)
    }
  }
  p[c] = e
  return p
}, {} as Store)
