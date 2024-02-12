import { ElectronAPI } from '@electron-toolkit/preload'
import { IElectronAPI } from './preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IElectronAPI
  }
}
