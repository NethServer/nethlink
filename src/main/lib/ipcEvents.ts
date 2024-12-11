import { AccountController, DevToolsController } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { IPC_EVENTS } from '@shared/constants'
import { Account, OnDraggingWindow, PAGES } from '@shared/types'
import { BrowserWindow, app, ipcMain, screen, shell } from 'electron'
import { join } from 'path'
import { Log } from '@shared/utils/logger'
import { NethLinkController } from '@/classes/controllers/NethLinkController'
import { AppController } from '@/classes/controllers/AppController'
import { store } from './mainStore'
import { debouncer, getAccountUID, getPageFromQuery } from '@shared/utils/utils'
import { NetworkController } from '@/classes/controllers/NetworkController'
import { useLogin } from '@shared/useLogin'
import { PhoneIslandWindow } from '@/classes/windows'


function onSyncEmitter<T>(
  channel: IPC_EVENTS,
  asyncCallback: (...args: any[]) => Promise<T>
): void {
  ipcMain.on(channel, async (event, ...args) => {
    let syncResponse = [undefined, undefined] as [T | undefined, Error | undefined]
    try {
      const response = await asyncCallback(...args)
      syncResponse = [response, undefined]
    } catch (e: unknown) {
      let error = new Error()
      if (typeof e === 'object') {
        error = e as Error
      } else if (typeof e === 'string') {
        error.message = e
      } else {
        error.message = "Unknown error"
      }
      syncResponse = [undefined, error]
    }
    event.returnValue = syncResponse
  })
}
export function once(event: IPC_EVENTS, callback: () => void) {
  ipcMain.once(event, () => {
    callback()
  })
}
export function registerIpcEvents() {

  let draggingWindows: OnDraggingWindow = {}

  onSyncEmitter(IPC_EVENTS.GET_LOCALE, async () => {
    return app.getSystemLocale()
  })

  ipcMain.on(IPC_EVENTS.UPDATE_SHARED_STATE, (_, newState, page, selector) => {
    const windows = BrowserWindow.getAllWindows();
    store.updateStore(newState, `${page}[${selector}]`)
    windows.forEach(win => {
      if (page !== win.webContents.getTitle()) {
        win.webContents.send(IPC_EVENTS.SHARED_STATE_UPDATED, newState, page);
      }
    });
  });

  ipcMain.on(IPC_EVENTS.START_DRAG, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      const cursorPosition = screen.getCursorScreenPoint();
      const startMousePosition = { x: cursorPosition.x, y: cursorPosition.y };
      const [x, y] = window.getPosition()
      const startWindowPosition = {
        x, y
      }
      if (!draggingWindows.hasOwnProperty(window.title)) {
        const interval: number = setInterval(() => {
          updateWindowPosition(window)
        }, 1000 / 60) as unknown as number; // => 60 frames per seconds
        draggingWindows = {
          ...draggingWindows,
          [window.title]: {
            interval,
            startMousePosition,
            startWindowPosition
          }
        }
      }
    }
  });

  ipcMain.on(IPC_EVENTS.STOP_DRAG, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window && draggingWindows.hasOwnProperty(window.title)) {
      const draggingWindow = draggingWindows[window.title]
      clearInterval(draggingWindow.interval)
      delete draggingWindows[window.title]
      const cursorPosition = screen.getCursorScreenPoint();
      const deltaX = cursorPosition.x - draggingWindow.startMousePosition.x;
      const deltaY = cursorPosition.y - draggingWindow.startMousePosition.y;
      if (Math.abs(deltaX) <= 3 && Math.abs(deltaY) <= 3) {
        debouncer(IPC_EVENTS.ENABLE_CLICK, () => {
          event.sender.send(IPC_EVENTS.ENABLE_CLICK)
        }, 100)
      }
    }
  });


  function updateWindowPosition(window: Electron.BrowserWindow) {
    try {
      const draggingWindow = draggingWindows[window.title]
      if (draggingWindow) {
        const cursorPosition = screen.getCursorScreenPoint();
        const deltaX = cursorPosition.x - draggingWindow.startMousePosition.x;
        const deltaY = cursorPosition.y - draggingWindow.startMousePosition.y;
        if (deltaX !== 0 || deltaY !== 0) {
          const newX = draggingWindow.startWindowPosition.x + deltaX;
          const newY = draggingWindow.startWindowPosition.y + deltaY;
          if (window.title === PAGES.PHONEISLAND) {
            const { width, height } = PhoneIslandWindow.currentSize
            window.setBounds({
              x: newX,
              y: newY,
              width,
              height
            }, false)
          } else {
            const [w, h] = window.getContentSize()
            window.setBounds({
              x: newX,
              y: newY,
              width: w,
              height: h
            }, false)
          }
        }
      }
    } catch (e) {

    }
  }



  ipcMain.on(IPC_EVENTS.UPDATE_CONNECTION_STATE, (_, isOnline) => {
    if (store.store) {
      Log.info('INFO update connection state:', isOnline)
      store.set('connection', isOnline)
      if (!store.store.account) {
        store.saveToDisk()
      }
    }
  });

  ipcMain.on(IPC_EVENTS.REQUEST_SHARED_STATE, (event) => {
    const page = getPageFromQuery(event?.sender?.getTitle())
    event.sender.send(IPC_EVENTS.SHARED_STATE_UPDATED, store.store, page);
  });

  ipcMain.on(IPC_EVENTS.CLOSE_NETH_LINK, async (event) => {
    AppController.safeQuit()
  })

  ipcMain.on(IPC_EVENTS.OPEN_HOST_PAGE, async (_, path) => {
    const account = store.store.account
    shell.openExternal(join('https://' + account!.host, path))
  })

  ipcMain.on(IPC_EVENTS.OPEN_EXTERNAL_PAGE, async (_, path) => {
    shell.openExternal(join(path))
  })

  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_RESIZE, (_, size) => {
    PhoneIslandController.instance.resize(size)
  })
  ipcMain.on(IPC_EVENTS.SHOW_PHONE_ISLAND, (_, size) => {
    PhoneIslandController.instance.showPhoneIsland(size)
  })
  ipcMain.on(IPC_EVENTS.HIDE_PHONE_ISLAND, (_) => {
    PhoneIslandController.instance.hidePhoneIsland()
  })
  ipcMain.on(IPC_EVENTS.LOGIN_WINDOW_RESIZE, (_, h) => {
    LoginController.instance.resize(h)
  })
  ipcMain.on(IPC_EVENTS.DELETE_ACCOUNT, (_, account: Account) => {
    Log.info('DELETE ACCOUNT', account)
    const accountUID = getAccountUID(account)
    const newStore = Object.assign({}, store.store)
    delete newStore.auth!.availableAccounts[accountUID]
    store.set('auth', newStore.auth, true)
    store.updateStore(newStore, 'delete account')
    store.saveToDisk(true)
  })
  ipcMain.on(IPC_EVENTS.HIDE_LOGIN_WINDOW, () => {
    LoginController.instance.hide()
  })

  ipcMain.on(IPC_EVENTS.CHANGE_THEME, (_, theme) => {
    AccountController.instance.updateTheme(theme)
    PhoneIslandController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    LoginController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    DevToolsController.instance?.window?.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    NethLinkController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
  })

  ipcMain.on(IPC_EVENTS.GET_NETHVOICE_CONFIG, async (e, account) => {
    //I import the config file of this host to take the information about SIP_host and port only if I am on demo-leopard I have to take them static
    const { parseConfig } = useLogin()
    const config: string = await NetworkController.instance.get(`https://${account.host}/config/config.production.js`)
    account = parseConfig(account, config)
    e.reply(IPC_EVENTS.SET_NETHVOICE_CONFIG, account)
  })

  ipcMain.on(IPC_EVENTS.EMIT_QUEUE_UPDATE, (_, queue) => {
    NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_QUEUE_UPDATE, queue)
  })

  ipcMain.on(IPC_EVENTS.EMIT_CALL_END, (_) => {
    NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_CALL_END)
  })

  ipcMain.on(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, (_, mainPresence) => {
    NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, mainPresence)
  })

  ipcMain.on(IPC_EVENTS.EMIT_PARKING_UPDATE, (_) => {
    NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_PARKING_UPDATE)
  })

}


