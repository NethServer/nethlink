import { subscribe } from 'diagnostics_channel'
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

type Store = Record<keyof LocalStorageData, any>

export const store: Store = Object.keys(initialData).reduce<Store>((p, c) => {
  const s = localStore.getState()
  const elem = s[c]
  p[c] = elem
  return p
}, {} as Store)
