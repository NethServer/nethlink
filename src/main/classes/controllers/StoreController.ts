import { createStore } from 'zustand/vanilla'

type LocalStorageData = {}

type LocalStorageState = {
  readonly getData: (key: keyof LocalStorageData) => () => any
  readonly setData: (key: keyof LocalStorageData) => (value: any) => void
} & LocalStorageData

const initialData: LocalStorageData = {}

export const store = createStore<LocalStorageState>((set, get) => ({
  ...initialData,
  getData: (key: keyof LocalStorageData) => {
    return () => {
      return get()[key]
    }
  },
  setData: (key: keyof LocalStorageData) => (value: any | any[]) =>
    set((store: LocalStorageState) => ({
      ...store,
      [key]: value
    }))
}))
