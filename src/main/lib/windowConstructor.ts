import { is } from '@electron-toolkit/utils'
import { BrowserWindow, ipcMain } from 'electron'
import { mainBindings } from 'i18next-electron-fs-backend'
import { join } from 'path'
import fs from 'fs'
import { isDevTools } from '@shared/utils/utils'

export type WindowOptions = {
  rendererPath?: string
  devPath?: string
} & Electron.BrowserWindowConstructorOptions

export function createWindow(
  id: string,
  config: WindowOptions = {
    width: 400,
    height: 300,
    show: false,
    fullscreenable: false,
    devPath: undefined
  },
  params?: Record<string, string>
): BrowserWindow {
  const mainWindow = new BrowserWindow({
    parent: undefined,
    title: id,
    ...config,
    titleBarStyle: config.titleBarStyle ?? (process.platform === 'darwin' ? 'customButtonsOnHover' : 'hidden'),
    ...(process.platform === 'linux' ? (config.icon ? { icon: config.icon } : {}) : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false,
      nodeIntegration: true
    },
    hiddenInMissionControl: false,
  })
  params = ({
    page: id,
    ...params
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const propsUrl = params
      ? Object.entries(params).reduce((p, c) => `${p}${p === '?' ? '' : '&'}${c[0]}=${c[1]}`, '?')
      : ''
    const devServerURL = `${process.env['ELECTRON_RENDERER_URL']!}/#/${id}${propsUrl}`
    mainWindow.loadURL(devServerURL, {})
  } else {
    const fileRoute = join(__dirname, '../renderer/index.html')
    mainWindow.loadFile(fileRoute, {
      hash: id,
      query: params
    })
  }

  mainWindow.on('hide', () => { })

  mainWindow.on('close', () => { })

  mainWindow.on('ready-to-show', () => {
    isDevTools() && mainWindow.webContents.openDevTools({
      mode: 'detach'
    })
  })

  mainBindings(ipcMain, mainWindow, fs)

  return mainWindow
}
