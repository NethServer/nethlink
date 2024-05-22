import { AvailableThemes, OperatorsType, PageType, QueuesType } from '@shared/types'
import { create } from 'zustand'

export type LocalStorageData = {
  operators?: OperatorsType
  page?: PageType
  theme?: AvailableThemes
  loadDataEnded: boolean
  profilePicture?: any
  customerCards?: any
  speedDial?: any
  toast?: any
  user?: any
  park?: any
  notifications?: any
  userActions?: any
  globalSearch?: any
  queues?: QueuesType
  queueManagerQueues?: any
  ctiStatus?: any
  sideDrawer?: any
  lines?: any
  lastCalls?: any
  darkTheme?: any
  phoneLines?: any
  authentication?: any
}

type LocalStorageState = {
  readonly getData: (key: keyof LocalStorageData) => () => any
  readonly setData: (key: keyof LocalStorageData) => (value: any) => void
} & LocalStorageData

const initialData: LocalStorageData = {
  loadDataEnded: false
}

export const useLocalStore = create<LocalStorageState>((set, get) => ({
  ...initialData,
  getData: (key: keyof LocalStorageData) => get()[key],
  setData: (key: keyof LocalStorageData) => (value: any | any[]) =>
    set((store: LocalStorageState) => ({
      ...store,
      [key]: value
    }))
}))
