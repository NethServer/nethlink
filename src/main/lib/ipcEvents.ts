import { AccountController, DevToolsController } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account, OnDraggingWindow, PAGES } from '@shared/types'
import { BrowserWindow, Notification, NotificationConstructorOptions, app, ipcMain, screen, shell } from 'electron'
import { join } from 'path'
import { log } from '@shared/utils/logger'
import { cloneDeep } from 'lodash'
import { NethLinkController } from '@/classes/controllers/NethLinkController'
import { AppController } from '@/classes/controllers/AppController'
import moment from 'moment'
import { store } from './mainStore'
import { debouncer, getPageFromQuery, isDev } from '@shared/utils/utils'
import { NetworkController } from '@/classes/controllers/NetworkController'
import { useLogin } from '@shared/useLogin'


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
      log(e)
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

  //TODO: move each event to the controller it belongs to
  onSyncEmitter(IPC_EVENTS.GET_LOCALE, async () => {
    return app.getSystemLocale()
  })

  // ipcMain.on(IPC_EVENTS.DEV_TOOL_TOGGLE_CONNECTION, (e) => {
  //   const windows = BrowserWindow.getAllWindows();
  //   windows.forEach(win => {
  //     log(win.webContents?.session)
  //     win.webContents?.session.enableNetworkEmulation({
  //       offline: false
  //     });
  //   });
  // })

  ipcMain.on(IPC_EVENTS.UPDATE_SHARED_STATE, (event, newState, page, selector) => {
    const windows = BrowserWindow.getAllWindows();
    store.updateStore(newState)
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
      if (deltaX === 0 && deltaY === 0) {
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
          window.setPosition(newX, newY);
        }
      }
    } catch (e) {

    }
  }



  ipcMain.on(IPC_EVENTS.UPDATE_CONNECTION_STATE, (event, isOnline) => {
    log('CONNECTION STATE', isOnline)
    store.set('connection', isOnline)
  });

  ipcMain.on(IPC_EVENTS.REQUEST_SHARED_STATE, (event) => {
    const page = getPageFromQuery(event?.sender?.getTitle())
    event.sender.send(IPC_EVENTS.SHARED_STATE_UPDATED, store.store, page);
  });

  ipcMain.on(IPC_EVENTS.CLOSE_NETH_LINK, async (event) => {
    AppController.safeQuit()
  })

  ipcMain.on(IPC_EVENTS.OPEN_HOST_PAGE, async (_, path) => {
    const account = store.store['account']
    shell.openExternal(join('https://' + account!.host, path))
  })

  ipcMain.on(IPC_EVENTS.OPEN_EXTERNAL_PAGE, async (_, path) => {
    shell.openExternal(join(path))
  })

  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_RESIZE, (event, w, h) => {
    PhoneIslandController.instance.resize(w, h)
  })
  ipcMain.on(IPC_EVENTS.SHOW_PHONE_ISLAND, (event) => {
    PhoneIslandController.instance.showPhoneIsland()
  })
  ipcMain.on(IPC_EVENTS.HIDE_PHONE_ISLAND, (event) => {
    PhoneIslandController.instance.hidePhoneIsland()
  })
  ipcMain.on(IPC_EVENTS.LOGIN_WINDOW_RESIZE, (event, h) => {
    LoginController.instance.resize(h)
  })
  ipcMain.on(IPC_EVENTS.HIDE_LOGIN_WINDOW, () => {
    LoginController.instance.hide()
  })

  ipcMain.on(IPC_EVENTS.CHANGE_THEME, (event, theme) => {
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

  ipcMain.on(IPC_EVENTS.SEND_NOTIFICATION, (event, options: NotificationConstructorOptions, openUrl) => {
    if (process.platform !== 'darwin') {
      options.icon = "../../../public/TrayNotificationIcon.svg"
    }
    log(options)
    const notification: Notification = new Notification(options)

    setTimeout(() => {
      notification.on('failed', () => log('NOTIFICATION failed'))
      notification.on('action', () => log('NOTIFICATION action'))
      notification.on('close', () => log('NOTIFICATION close'))
      notification.on('reply', () => log('NOTIFICATION reply'))
      notification.on('show', () => log('NOTIFICATION show'))

      notification.on("click", () => {
        log('RECEIVED CLICK ON NOTIFICATION', options, openUrl)
        if (openUrl) {
          shell.openExternal(openUrl)
        }
      })
    }, 100);

    notification.show()
    log('RECEIVED SEND NOTIFICATION', options, openUrl, notification)

  })

}


