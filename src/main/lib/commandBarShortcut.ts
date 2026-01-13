import { Log } from '@shared/utils/logger'

export type CommandBarDoubleTapModifier = 'Ctrl' | 'Alt' | 'AltGr' | 'Cmd'

let uiohookStarted = false
let lastModifierPress = 0
let modifierPressedAlone = false
const DOUBLE_TAP_THRESHOLD_MS = 400

let currentModifier: CommandBarDoubleTapModifier | undefined
let keydownHandler: ((e: any) => void) | undefined
let keyupHandler: ((e: any) => void) | undefined

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
      if (typeof uIOhook.off === 'function') {
        uIOhook.off('keydown', keydownHandler)
      } else if (typeof uIOhook.removeListener === 'function') {
        uIOhook.removeListener('keydown', keydownHandler)
      }
    }

    if (keyupHandler) {
      if (typeof uIOhook.off === 'function') {
        uIOhook.off('keyup', keyupHandler)
      } else if (typeof uIOhook.removeListener === 'function') {
        uIOhook.removeListener('keyup', keyupHandler)
      }
    }

    uIOhook.stop()
    Log.info('uIOhook stopped (Command Bar shortcut)')
  } catch (e) {
    Log.warning('Failed to stop uIOhook (Command Bar shortcut):', e)
  } finally {
    uiohookStarted = false
    lastModifierPress = 0
    modifierPressedAlone = false
    currentModifier = undefined
    keydownHandler = undefined
    keyupHandler = undefined
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

    // On keydown: track if modifier is pressed, but invalidate if other keys are pressed
    keydownHandler = (e: any) => {
      if (isModifierKeyEvent(e, UiohookKey, modifier)) {
        // Modifier pressed - mark as potentially alone
        modifierPressedAlone = true
      } else {
        // Another key pressed - this is a combo, not a solo modifier tap
        modifierPressedAlone = false
      }
    }

    // On keyup: check double-tap only if modifier was released alone
    keyupHandler = (e: any) => {
      if (!isModifierKeyEvent(e, UiohookKey, modifier)) return

      // Only count as a tap if no other keys were pressed
      if (!modifierPressedAlone) {
        modifierPressedAlone = false
        return
      }

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
      modifierPressedAlone = false
    }

    uIOhook.on('keydown', keydownHandler)
    uIOhook.on('keyup', keyupHandler)
    uIOhook.start()

    uiohookStarted = true
    currentModifier = modifier
    Log.info(`Command Bar shortcut initialized (double-tap ${modifier})`)
  } catch (e) {
    uiohookStarted = false
    currentModifier = undefined
    keydownHandler = undefined
    keyupHandler = undefined
    Log.warning('Failed to initialize Command Bar shortcut (uiohook):', e)
  }
}
