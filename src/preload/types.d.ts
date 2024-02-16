import { ElectronAPI } from '@electron-toolkit/preload'
import { IElectronAPI } from '.'

declare global {
  interface Window {
    electron: ElectronAPI
    api: IElectronAPI
  }
}
