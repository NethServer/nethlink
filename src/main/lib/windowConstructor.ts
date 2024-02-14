import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import { join } from 'path'

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
  }
): BrowserWindow {
  const mainWindow = new BrowserWindow({
    parent: undefined,
    ...config,
    ...(process.platform === 'linux' ? (config.icon ? { icon: config.icon } : {}) : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const devServerURL = `${process.env['ELECTRON_RENDERER_URL']!}/#/${id}`
    console.log('DEV', devServerURL, id)
    mainWindow.loadURL(devServerURL)
  } else {
    const fileRoute = join(__dirname, '../renderer/index.html')
    console.log('PROD', fileRoute, id)
    mainWindow.loadFile(fileRoute, {
      hash: id
    })
  }

  // if (is.dev) {
  //   mainWindow.webContents.openDevTools({
  //     mode: 'detach'
  //   })
  // }

  return mainWindow
}
