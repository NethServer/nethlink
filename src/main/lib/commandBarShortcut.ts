import { Log } from '@shared/utils/logger'

export type CommandBarDoubleTapModifier = 'Ctrl' | 'Alt' | 'AltGr' | 'Cmd'

let uiohookStarted = false
let lastModifierPress = 0
const DOUBLE_TAP_THRESHOLD_MS = 400

let currentModifier: CommandBarDoubleTapModifier | undefined
let keydownHandler: ((e: any) => void) | undefined

function isModifierKeyEvent(e: any, UiohookKey: any, modifier: CommandBarDoubleTapModifier) {
  switch (modifier) {
    case 'Cmd':
      return e.keycode === UiohookKey.Meta || e.keycode === UiohookKey.MetaRight
    case 'Ctrl':
      return e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight
    case 'Alt':
      return e.keycode === UiohookKey.Alt || e.keycode === UiohookKey.AltRight
    case 'AltGr':
      // On most Linux layouts AltGr is the right Alt key, but it can also emit CtrlRight.
      // Be permissive so the configured shortcut actually triggers.
      return (
        e.keycode === UiohookKey.AltRight ||
        e.keycode === UiohookKey.CtrlRight
      )
  }
}

export function getDefaultCommandBarModifier(): CommandBarDoubleTapModifier {
  return process.platform === 'darwin' ? 'Cmd' : 'Ctrl'
}

export function isCommandBarDoubleTapShortcutStarted(): boolean {
  return uiohookStarted
}

export function stopCommandBarDoubleTapShortcut() {
  if (!uiohookStarted) return

  try {
    const { uIOhook } = require('uiohook-napi')

    if (keydownHandler) {
      // uiohook-napi uses EventEmitter-like API
      if (typeof uIOhook.off === 'function') {
        uIOhook.off('keydown', keydownHandler)
      } else if (typeof uIOhook.removeListener === 'function') {
        uIOhook.removeListener('keydown', keydownHandler)
      }
    }

    uIOhook.stop()
    Log.info('uIOhook stopped (Command Bar shortcut)')
  } catch (e) {
    Log.warning('Failed to stop uIOhook (Command Bar shortcut):', e)
  } finally {
    uiohookStarted = false
    lastModifierPress = 0
    currentModifier = undefined
    keydownHandler = undefined
  }
}

export function startCommandBarDoubleTapShortcut(
  modifier: CommandBarDoubleTapModifier,
  onTrigger: () => void,
) {
  // Allow changing modifier at runtime.
  if (uiohookStarted && currentModifier === modifier) return
  if (uiohookStarted && currentModifier !== modifier) {
    stopCommandBarDoubleTapShortcut()
  }

  try {
    const { uIOhook, UiohookKey } = require('uiohook-napi')

    keydownHandler = (e: any) => {
      if (!isModifierKeyEvent(e, UiohookKey, modifier)) return

      const now = Date.now()
      if (now - lastModifierPress < DOUBLE_TAP_THRESHOLD_MS) {
        try {
          onTrigger()
        } catch (err) {
          Log.warning('Command Bar double-tap trigger failed:', err)
        }
        lastModifierPress = 0
      } else {
        lastModifierPress = now
      }
    }

    uIOhook.on('keydown', keydownHandler)
    uIOhook.start()

    uiohookStarted = true
    currentModifier = modifier
    Log.info(`Command Bar shortcut initialized (double-tap ${modifier})`)
  } catch (e) {
    uiohookStarted = false
    currentModifier = undefined
    keydownHandler = undefined
    Log.warning('Failed to initialize Command Bar shortcut (uiohook):', e)
  }
}
