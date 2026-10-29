import { shell } from 'electron'
import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'

// Transparent, always on top: the chat stays in view with NethLink closed.
export class ChatIslandWindow extends BaseWindow {
  constructor() {
    super(PAGES.CHATISLAND, {
      width: 440,
      height: 600,
      show: false,
      focusable: true,
      acceptFirstMouse: true,
      fullscreenable: false,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: false,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      fullscreen: false,
      enableLargerThanScreen: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 },
      // It shows what colleagues and guests send: no Node in the page, only the preload's bridge.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    })

    this.addOnBuildListener(() => {
      const win = this.getWindow()
      win?.setAlwaysOnTop(true, 'screen-saver')
      // Links open in the browser, never in a window of ours; the page never leaves the app.
      win?.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:\/\//i.test(url)) shell.openExternal(url)
        return { action: 'deny' }
      })
      win?.webContents.on('will-navigate', (e, url) => {
        if (url !== win.webContents.getURL()) e.preventDefault()
      })
    })
  }
}
