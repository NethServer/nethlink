import { AccountController, DevToolsController } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { CommandBarController } from '@/classes/controllers/CommandBarController'
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
import {
  CommandBarDoubleTapModifier,
  getDefaultCommandBarModifier,
  startCommandBarDoubleTapShortcut,
  stopCommandBarDoubleTapShortcut,
} from './commandBarShortcut'

const { keyboard, Key } = require("@nut-tree-fork/nut-js");

// Global flag to ensure audio warm-up runs only once per app session
let hasRunAudioWarmup = false

// Global flag to track if there's an active call (prevents PhoneIsland reload during calls)
let hasActiveCall = false

// Export function to check active call state from other modules
export function isCallActive(): boolean {
  return hasActiveCall
}

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

function isUserLoggedIn(): boolean {
  return !!store.store.account
}

// Keep exactly one Command Bar shortcut active at a time.
let activeCommandBarAccelerator: string | undefined
let activeCommandBarLastTrigger = 0

export function disableCommandBarShortcuts() {
  stopCommandBarDoubleTapShortcut()

  if (activeCommandBarAccelerator) {
    try {
      globalShortcut.unregister(activeCommandBarAccelerator)
    } catch (e) {
      Log.warning('Failed to unregister active Command Bar shortcut:', e)
    }
  }

  activeCommandBarAccelerator = undefined
  activeCommandBarLastTrigger = 0
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
            const bounds = window.getBounds()
            window.setBounds({
              x: newX,
              y: newY,
              width: bounds.width,
              height: bounds.height
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
      // Include flag to indicate if audio warmup should run
      // Only run warmup if: not already run AND main device is NOT physical (i.e., nethlink or webrtc)
      const deviceType = account.data?.default_device?.type
      const isNethLinkDevice = deviceType !== 'physical'
      const shouldRunWarmup = !hasRunAudioWarmup && isNethLinkDevice
      if (shouldRunWarmup) {
        hasRunAudioWarmup = true
      }
      Log.info('Send CHANGE_PREFERRED_DEVICES event with', {
        preferredDevices: account.preferredDevices,
        shouldRunWarmup,
        deviceType
      })
      AccountController.instance.updatePreferredDevice(account.preferredDevices)
      PhoneIslandController.instance.window.emit(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, {
        ...account.preferredDevices,
        shouldRunWarmup
      })
    }, 250)
  })

  ipcMain.on(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, (_, devices) => {
    Log.info('Received CHANGE_PREFERRED_DEVICES in ipcEvents:', devices)
    AccountController.instance.updatePreferredDevice(devices)
    PhoneIslandController.instance.window.emit(IPC_EVENTS.CHANGE_PREFERRED_DEVICES, devices)
  })

  ipcMain.on(IPC_EVENTS.CHANGE_RINGTONE_SETTINGS, (_, settings) => {
    Log.info('Received CHANGE_RINGTONE_SETTINGS in ipcEvents:', settings)
    PhoneIslandController.instance.window.emit(IPC_EVENTS.CHANGE_RINGTONE_SETTINGS, settings)
  })

  ipcMain.on(IPC_EVENTS.PLAY_RINGTONE_PREVIEW, (_, audioData) => {
    PhoneIslandController.instance.window.emit(IPC_EVENTS.PLAY_RINGTONE_PREVIEW, audioData)
  })

  ipcMain.on(IPC_EVENTS.STOP_RINGTONE_PREVIEW, () => {
    PhoneIslandController.instance.window.emit(IPC_EVENTS.STOP_RINGTONE_PREVIEW)
  })

  ipcMain.on(IPC_EVENTS.AUDIO_PLAYER_CLOSED, () => {
    // Broadcast to all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send(IPC_EVENTS.AUDIO_PLAYER_CLOSED)
    })
  })

  // Track currently registered call shortcut to handle race conditions
  // (renderer may update store via UPDATE_SHARED_STATE before CHANGE_SHORTCUT is processed)
  let registeredCallShortcut: string | undefined = undefined

  ipcMain.on(IPC_EVENTS.CHANGE_SHORTCUT, async (_, combo) => {
    // Use tracked shortcut if available, otherwise fall back to store
    const previousCombo = registeredCallShortcut || store.store.account?.shortcut
    if (previousCombo) {
      try {
        globalShortcut.unregister(previousCombo)
        Log.info('Unregistered previous call shortcut:', previousCombo)
      } catch (e) {
        Log.warning('Failed to unregister previous call shortcut:', e)
      }
    }
    registeredCallShortcut = undefined

    AccountController.instance.updateShortcut(combo)

    if (!combo || combo.length === 0) {
      Log.info('Call shortcut cleared')
      return
    }

    try {
      const registered = globalShortcut.register(combo, async () => {
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
      })
      if (registered) {
        registeredCallShortcut = combo
        Log.info('Call shortcut registered:', combo)
      } else {
        Log.warning('Failed to register call shortcut:', combo)
      }
    } catch (e) {
      Log.warning('Failed to register call shortcut:', e)
    }
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

  ipcMain.on(IPC_EVENTS.EMIT_CALL_ACTIVE, (_) => {
    if (!hasActiveCall) {
      Log.info('Call active (started or answered) - setting hasActiveCall = true')
      hasActiveCall = true
    }
  })

  ipcMain.on(IPC_EVENTS.EMIT_CALL_END, (_) => {
    Log.info('Call ended - setting hasActiveCall = false')
    hasActiveCall = false
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

  ipcMain.on(IPC_EVENTS.TOGGLE_COMMAND_BAR, () => {
    try {
      if (!isUserLoggedIn()) return
      CommandBarController.instance?.toggle()
    } catch (e) {
      Log.error('TOGGLE_COMMAND_BAR error', e)
    }
  })

  ipcMain.on(IPC_EVENTS.SHOW_COMMAND_BAR, () => {
    try {
      if (!isUserLoggedIn()) return
      CommandBarController.instance?.show()
    } catch (e) {
      Log.error('SHOW_COMMAND_BAR error', e)
    }
  })

  ipcMain.on(IPC_EVENTS.HIDE_COMMAND_BAR, () => {
    try {
      CommandBarController.instance?.hide()
    } catch (e) {
      Log.error('HIDE_COMMAND_BAR error', e)
    }
  })

  ipcMain.on(IPC_EVENTS.CHANGE_COMMAND_BAR_SHORTCUT, async (_, combo) => {
    if (!isUserLoggedIn()) {
      disableCommandBarShortcuts()
      return
    }

    const rawCombo = typeof combo === 'string' ? combo.trim() : ''
    const normalizedCombo = rawCombo.replace(/AltGraph/g, 'AltGr')

    const toggle = () => {
      try {
        if (!isUserLoggedIn()) return
        CommandBarController.instance?.toggle()
      } catch (e) {
        Log.error('TOGGLE_COMMAND_BAR error', e)
      }
    }

    const allowedSoloModifiers: CommandBarDoubleTapModifier[] = ['Ctrl', 'Alt', 'AltGr', 'Cmd']
    const isSoloModifier = (value: string): value is CommandBarDoubleTapModifier =>
      allowedSoloModifiers.includes(value as CommandBarDoubleTapModifier)

    const isOnlyModifiersButMultiple = (value: string) => {
      const parts = value.split('+').map((p) => p.trim()).filter(Boolean)
      return parts.length > 1 && parts.every((p) => isSoloModifier(p))
    }

    const applyDefault = () => {
      disableCommandBarShortcuts()
      startCommandBarDoubleTapShortcut(getDefaultCommandBarModifier(), toggle)
    }

    const clearCurrent = () => {
      disableCommandBarShortcuts()
    }

    // Snapshot current persisted value so we can restore on failure.
    // Preserve distinction: undefined = never set, '' = explicitly cleared
    const persistedCombo = store.store.account?.commandBarShortcut?.trim()

    clearCurrent()

    // Clear => disable shortcut completely
    if (!normalizedCombo) {
      AccountController.instance.updateCommandBarShortcut('')
      Log.info('Command Bar shortcut cleared: shortcut disabled')
      return
    }

    // Reject modifier-only combos with multiple modifiers (e.g. Ctrl+Alt)
    if (isOnlyModifiersButMultiple(normalizedCombo)) {
      Log.warning('Invalid Command Bar shortcut (multiple modifiers only):', normalizedCombo)
      AccountController.instance.updateCommandBarShortcut('')
      applyDefault()
      return
    }

    // Modifier-only => use double-tap uiohook
    if (isSoloModifier(normalizedCombo)) {
      startCommandBarDoubleTapShortcut(normalizedCombo, toggle)
      AccountController.instance.updateCommandBarShortcut(normalizedCombo)
      Log.info('Command Bar shortcut changed (double-tap):', normalizedCombo)
      return
    }

    // Key combo => use Electron globalShortcut but require double-press.
    // Electron triggers the callback on single press; we gate it to double within threshold.
    let registered = false
    try {
      registered = globalShortcut.register(normalizedCombo, () => {
        const now = Date.now()
        if (now - activeCommandBarLastTrigger < 400) {
          activeCommandBarLastTrigger = 0
          toggle()
        } else {
          activeCommandBarLastTrigger = now
        }
      })
    } catch (e) {
      Log.warning('Failed to register Command Bar shortcut:', e)
      registered = false
    }

    if (registered) {
      activeCommandBarAccelerator = normalizedCombo
      activeCommandBarLastTrigger = 0
      AccountController.instance.updateCommandBarShortcut(normalizedCombo)
      Log.info('Command Bar shortcut changed (double-press):', normalizedCombo)
      return
    }

    // Registration failed => restore persisted combo or default
    Log.warning('Failed to register Command Bar shortcut:', normalizedCombo)
    if (persistedCombo && persistedCombo.length > 0) {
      // User had a custom shortcut - try to restore it
      if (isSoloModifier(persistedCombo)) {
        startCommandBarDoubleTapShortcut(persistedCombo, toggle)
      } else {
        try {
          const restored = globalShortcut.register(persistedCombo, () => {
            const now = Date.now()
            if (now - activeCommandBarLastTrigger < 400) {
              activeCommandBarLastTrigger = 0
              toggle()
            } else {
              activeCommandBarLastTrigger = now
            }
          })
          if (restored) {
            activeCommandBarAccelerator = persistedCombo
          } else {
            applyDefault()
          }
        } catch (e) {
          Log.warning('Failed to restore previous Command Bar shortcut:', e)
          applyDefault()
        }
      }
    } else if (persistedCombo === undefined) {
      // Never set - apply default
      applyDefault()
    }
    // If persistedCombo is '', user explicitly cleared it - don't apply any shortcut
  })
}
