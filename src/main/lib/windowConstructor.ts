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
    width: 900,
    height: 670,
    show: false,
    fullscreenable: false,
    devPath: undefined
  }
): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    parent: undefined,
    ...config,
    ...(process.platform === 'linux' ? (config.icon ? { icon: config.icon } : {}) : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true, //test
      contextIsolation: true, //test
      nodeIntegration: true
    }
  })
  // Don't forget to check if the port is the same as your dev server

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
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

  if (is.dev) {
    mainWindow.webContents.openDevTools({
      mode: 'detach'
    })
  }

  console.log(mainWindow.eventNames())

  return mainWindow
}
