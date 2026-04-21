import { PAGES } from '@shared/types'
import { BaseWindow } from './BaseWindow'
import { ipcMain } from 'electron'

export class PhoneIslandWindow extends BaseWindow {

  public static currentSize: Partial<Electron.Rectangle> = {}
  constructor() {
    super(PAGES.PHONEISLAND, {
      width: 0,
      height: 0,
      show: false,
      fullscreenable: true,
      autoHideMenuBar: true,
      closable: false,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      movable: false,
      resizable: false,
      skipTaskbar: true,
      roundedCorners: true,
      parent: undefined,
      transparent: true,
      hiddenInMissionControl: true,
      hasShadow: false,
      center: true,
      fullscreen: false,
      enableLargerThanScreen: false,
      frame: false,
      thickFrame: false,
      trafficLightPosition: { x: 0, y: 0 },
      webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false
      }
    })

    this.addOnBuildListener(() => {
      const window = this.getWindow()
      if (window) {
        // Set window level to ensure it appears above fullscreen applications
        window.setAlwaysOnTop(true, 'screen-saver')

        // Override console methods in the renderer to serialize objects before logging.
        // Without this, Chromium's console-message event converts objects to "[object Object]".
        window.webContents.on('did-finish-load', () => {
          window.webContents.executeJavaScript(`
            (function() {
              const serialize = (arg) => {
                if (arg === null || arg === undefined) return String(arg);
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              };
              ['log', 'info', 'warn', 'error', 'debug'].forEach((method) => {
                const original = console[method].bind(console);
                console[method] = (...args) => {
                  original(...args.map(serialize));
                };
              });
            })();
          `)
        })

        // Forward all console messages from PhoneIsland renderer to main process log file
        // Uses 'phone-island-log' channel which always writes to file (not gated by isDev)
        window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
          const levelMap = ['DEBUG', 'INFO', 'WARNING', 'ERROR']
          const levelStr = levelMap[level] || 'INFO'
          const source = sourceId ? sourceId.split('/').pop() : 'unknown'
          const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '')
          ipcMain.emit('phone-island-log', {}, `${timestamp} [PhoneIsland] [${levelStr}] ${message} (${source}:${line})`)
        })
      }
    })
  }
}
