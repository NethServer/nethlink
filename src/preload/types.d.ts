import { ElectronAPI } from '@electron-toolkit/preload'
import { IElectronAPI, CustomElectronAPI } from '.'

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: IElectronAPI
  }
}
