import { AccountController, DevToolsController } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { IPC_EVENTS } from '@shared/constants'
import { Account, OnDraggingWindow, PAGES } from '@shared/types'
import { BrowserWindow, app, ipcMain, screen, shell, desktopCapturer, globalShortcut, clipboard } from 'electron'
import { join } from 'path'
import { Log } from '@shared/utils/logger'
import { NethLinkController } from '@/classes/controllers/NethLinkController'
import { AppController } from '@/classes/controllers/AppController'
import { store } from './mainStore'
import { debouncer, getAccountUID, getPageFromQuery, isDev } from '@shared/utils/utils'
import { NetworkController } from '@/classes/controllers/NetworkController'
import { useLogin } from '@shared/useLogin'
import { PhoneIslandWindow } from '@/classes/windows'
import { ClientRequest, get } from 'http'
import os from 'os'

const { keyboard, Key } = require("@nut-tree-fork/nut-js");

// Global flag to ensure audio warm-up runs only once per app session
let hasRunAudioWarmup = false

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
    return app.getLocale()
  })

  ipcMain.on(IPC_EVENTS.EMIT_START_CALL, async (_event, phoneNumber) => {
    PhoneIslandController.instance.call(phoneNumber)
  })

  ipcMain.on(IPC_EVENTS.START_CALL_BY_URL, async (_event, url) => {
    function triggerError(e, request: ClientRequest | undefined = undefined) {
      Log.error(e)
      try {
        PhoneIslandController.instance.window.emit(IPC_EVENTS.END_CALL)
        NethLinkController.instance.window.emit(IPC_EVENTS.RESPONSE_START_CALL_BY_URL, false)
      } catch (e) {
        Log.error(e)
      } finally {
        request && request.destroy()
      }
    }
    try {
      const request = get(
        url,
        {
          timeout: 3000
        },
        (res) => {
          if (res.statusCode !== 200) {
            triggerError(new Error('status error'), request)
          }
          NethLinkController.instance.window.emit(IPC_EVENTS.RESPONSE_START_CALL_BY_URL, true)
          PhoneIslandController.instance.window.show()
          Log.debug('START_CALL_BY_URL', url, res.statusCode)
        }
      )

      request.on('error', (e) => {
        triggerError(e, request)
      })
    } catch (e) {
      triggerError(e)
    }
  })

  ipcMain.on(IPC_EVENTS.UPDATE_SHARED_STATE, (_, newState, page, selector) => {
    const windows = BrowserWindow.getAllWindows();
    store.updateStore(newState, `${page}[${selector}]`)
    windows.forEach(win => {
      const targetPage = win.webContents.getTitle()
      try {
        if (page !== targetPage) {
          win.webContents.send(IPC_EVENTS.SHARED_STATE_UPDATED, newState, page);
        }
      } catch (e) {
        Log.error(`Data origin: ${page}, target: ${targetPage}`, e)
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
      if (!draggingWindows?.hasOwnProperty(window.title)) {
        const interval: number = setInterval(() => {
          updateWindowPosition(window)
        }, 1000 / 300) as unknown as number; // => 300 frames per seconds
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
    if (window && draggingWindows?.hasOwnProperty(window.title)) {
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
      Log.info('Update connection state:', isOnline)
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

  ipcMain.on(IPC_EVENTS.OPEN_EXTERNAL_PAGE, async (event, path) => {
    shell.openExternal(path)
  })

  ipcMain.on(IPC_EVENTS.COPY_TO_CLIPBOARD, async (_, text) => {
    clipboard.writeText(text)
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

  ipcMain.on(IPC_EVENTS.CHANGE_DEFAULT_DEVICE, (_, ext, force) => {
    PhoneIslandController.instance.updateDefaultDevice(ext, force ?? false)
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
    try {
      NethLinkController.instance?.window?.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    } catch (e) {
      Log.error(e)
    }
    try {
      DevToolsController.instance?.window?.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_READY, () => {
    Log.info('PhoneIsland is ready to receive events')
    const account = store.get('account') as Account

    setTimeout(() => {
      Log.info('Send CHANGE_PREFERRED_DEVICES event with', account.preferredDevices)
      AccountController.instance.updatePreferredDevice(account.preferredDevices)
      PhoneIslandController.instance.window.emit(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, account.preferredDevices)
    }, 250)
  })

  // Handler for warm-up audio devices request from renderer
  ipcMain.on(IPC_EVENTS.WARMUP_AUDIO_DEVICES, async () => {
    // Check if warm-up has already been executed
    if (hasRunAudioWarmup) {
      Log.info('[WARMUP] Audio warm-up already executed, skipping...')
      return
    }

    // Mark as executed
    hasRunAudioWarmup = true

    try {
      Log.info('[WARMUP] Starting silent echo test to warm up audio devices...')

      // Hide the PhoneIsland window to prevent it from showing during warm-up
      PhoneIslandController.instance.forceHide()

      // Mute the PhoneIsland window audio
      PhoneIslandController.instance.muteAudio()

      // Wait a bit to ensure mute and hide are applied
      await new Promise(resolve => setTimeout(resolve, 100))

      // Start echo test call to *43
      Log.info('[WARMUP] Starting call to *43')
      PhoneIslandController.instance.call('*43')

      // Keep the call active for 5 seconds to warm up devices
      await new Promise(resolve => setTimeout(resolve, 1500))

      // End the call
      Log.info('[WARMUP] Ending echo test call')
      PhoneIslandController.instance.window.emit(IPC_EVENTS.END_CALL)

      // Wait a bit before unmuting and showing
      await new Promise(resolve => setTimeout(resolve, 250))

      // Unmute the PhoneIsland window audio
      PhoneIslandController.instance.unmuteAudio()

      // Show the window again (only if it has content)
      PhoneIslandController.instance.forceShow()

      Log.info('[WARMUP] Audio warm-up completed successfully')
    } catch (error) {
      Log.error('[WARMUP] Error during audio warm-up:', error)
      // Make sure to unmute and show even if there's an error
      PhoneIslandController.instance.unmuteAudio()
      PhoneIslandController.instance.forceShow()
    }
  })

  ipcMain.on(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, (_, devices) => {
    Log.info('Received CHANGE_PREFERRED_DEVICES in ipcEvents:', devices)
    AccountController.instance.updatePreferredDevice(devices)
    PhoneIslandController.instance.window.emit(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, devices)
  })

  ipcMain.on(IPC_EVENTS.CHANGE_SHORTCUT, async (_, combo) => {
    // unregister previous shortcut
    await globalShortcut.unregisterAll();

    // save config to disk
    AccountController.instance.updateShortcut(combo)

    // register shortcut
    globalShortcut.register(combo, async () => {
      // get selected text content
      const isMac = os.platform() === 'darwin'
      const isLinux = os.platform() === 'linux';
      const modifierKey = isMac ? Key.LeftSuper : Key.LeftControl
      keyboard.config.autoDelayMs = 50;
      await keyboard.pressKey(modifierKey);
      await keyboard.pressKey(Key.C);
      await keyboard.releaseKey(Key.C);
      await keyboard.releaseKey(modifierKey);
      await new Promise(resolve => setTimeout(resolve, 100));

      // trim spaces
      let selectedText = await clipboard.readText(isLinux ? 'selection' : 'clipboard');
      if (typeof selectedText !== 'string') return
      selectedText = selectedText.trim()

      // remove spaces between text
      const prefixMatch = selectedText.match(/^[*#+]+/)
      const prefix = prefixMatch ? prefixMatch[0] : ''
      let sanitized = selectedText.replace(/[^\d]/g, '')
      let number = prefix + sanitized

      // check is a valid number
      const isValidNumber = /^([*#+]?)(\d{2,})$/.test(number)
      if (isValidNumber) {
        Log.info('Shortcut call to:', number)
        PhoneIslandController.instance.call(number)
      } else {
        Log.info('Selected text is not a valid number:', selectedText)
      }
    });
  })

  ipcMain.on(IPC_EVENTS.GET_NETHVOICE_CONFIG, async (e, account) => {
    //I import the config file of this host to take the information about SIP_host and port only if I am on demo-leopard I have to take them static
    const { parseConfig } = useLogin()
    const config: string = await NetworkController.instance.get(`https://${account.host}/config/config.production.js`)
    account = parseConfig(account, config)
    e.reply(IPC_EVENTS.SET_NETHVOICE_CONFIG, account)
  })

  ipcMain.on(IPC_EVENTS.EMIT_QUEUE_UPDATE, (_, queue) => {
    try {
      NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_QUEUE_UPDATE, queue)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.EMIT_CALL_END, (_) => {
    try {
      NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_CALL_END)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, (_, mainPresence) => {
    try {
      NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, mainPresence)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.EMIT_PARKING_UPDATE, (_) => {
    try {
      NethLinkController.instance.window.emit(IPC_EVENTS.EMIT_PARKING_UPDATE)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.UPDATE_ACCOUNT, (_) => {
    try {
      NethLinkController.instance.window.emit(IPC_EVENTS.UPDATE_ACCOUNT)
    } catch (e) {
      Log.error(e)
    }
  })

  ipcMain.on(IPC_EVENTS.RECONNECT_SOCKET, async () => {
    try {
      await AccountController.instance.autoLogin()
      NethLinkController.instance.window.emit(IPC_EVENTS.RECONNECT_SOCKET)
    } catch (e) {
      Log.error('SOCKET Reconnection error on logout', e)
    }
  })

  ipcMain.on(IPC_EVENTS.FULLSCREEN_ENTER, () => {
    try {
      PhoneIslandController.instance.window.getWindow()?.setFullScreen(true);
    } catch (e) {
      Log.error('ENTER FULLSCREEN error ', e)
    }
  })
  ipcMain.on(IPC_EVENTS.FULLSCREEN_EXIT, () => {
    try {
      PhoneIslandController.instance.window.getWindow()?.setFullScreen(false);
    } catch (e) {
      Log.error('EXIT FULLSCREEN error ', e)
    }
  })
  ipcMain.on(IPC_EVENTS.SCREEN_SHARE_INIT, () => {
    desktopCapturer.getSources({ types: ['screen'] }) // allow only entire screen sharing
      .then(sources => {
        PhoneIslandController.instance?.window?.emit(IPC_EVENTS.SCREEN_SHARE_SOURCES, sources)
      })
      .catch(e => {
        Log.error('ENTER SCREEN_SHARE_INIT error ', e)
      });
  });

  ipcMain.on(IPC_EVENTS.URL_OPEN, (_, data) => {
    try {
      PhoneIslandController.instance.window.emit(IPC_EVENTS.URL_OPEN, data)
    } catch (e) {
      Log.error('URL PARAM error', e)
    }
  })
}
