/**
 * Native Windows API calls to force window focus.
 * This is needed because Electron's focus() doesn't work reliably on Windows
 * when another application has the foreground.
 */

import { BrowserWindow } from 'electron'
import { Log } from '@shared/utils/logger'

let user32: any = null
let kernel32: any = null

function initWindowsApi() {
  if (process.platform !== 'win32') return false
  if (user32 && kernel32) return true

  try {
    const koffi = require('koffi')

    user32 = koffi.load('user32.dll')
    kernel32 = koffi.load('kernel32.dll')

    return true
  } catch (e) {
    Log.warning('Failed to load Windows native APIs:', e)
    return false
  }
}

// Virtual key codes
const VK_MENU = 0x12 // Alt key
const KEYEVENTF_KEYUP = 0x0002

/**
 * Force a window to the foreground on Windows.
 * Uses native Win32 API calls to bypass Windows' focus stealing prevention.
 */
export function forceWindowFocus(window: BrowserWindow): boolean {
  if (process.platform !== 'win32') return false

  if (!initWindowsApi()) return false

  try {
    const koffi = require('koffi')

    // Define the functions we need
    const GetCurrentThreadId = kernel32.func('uint32_t GetCurrentThreadId()')
    const GetWindowThreadProcessId = user32.func('uint32_t GetWindowThreadProcessId(void* hwnd, uint32_t* lpdwProcessId)')
    const AttachThreadInput = user32.func('bool AttachThreadInput(uint32_t idAttach, uint32_t idAttachTo, bool fAttach)')
    const SetForegroundWindow = user32.func('bool SetForegroundWindow(void* hwnd)')
    const BringWindowToTop = user32.func('bool BringWindowToTop(void* hwnd)')
    const SetFocus = user32.func('void* SetFocus(void* hwnd)')
    const GetForegroundWindow = user32.func('void* GetForegroundWindow()')
    const ShowWindow = user32.func('bool ShowWindow(void* hwnd, int nCmdShow)')
    const keybd_event = user32.func('void keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)')

    // Get the native window handle
    const hwnd = window.getNativeWindowHandle()

    // Get current thread ID
    const currentThreadId = GetCurrentThreadId()

    // Get the thread ID of the foreground window
    const foregroundHwnd = GetForegroundWindow()
    const foregroundThreadId = GetWindowThreadProcessId(foregroundHwnd, null)

    // Simulate Alt key press/release - this is a classic Windows trick
    // to allow SetForegroundWindow to work when another app has focus
    keybd_event(VK_MENU, 0, 0, 0) // Alt down
    keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0) // Alt up

    // Attach our thread to the foreground thread's input
    if (currentThreadId !== foregroundThreadId) {
      AttachThreadInput(currentThreadId, foregroundThreadId, true)
    }

    // Ensure window is shown (SW_SHOW = 5)
    ShowWindow(hwnd, 5)

    // Now we can set our window as foreground
    SetForegroundWindow(hwnd)
    BringWindowToTop(hwnd)
    SetFocus(hwnd)

    // Detach the threads
    if (currentThreadId !== foregroundThreadId) {
      AttachThreadInput(currentThreadId, foregroundThreadId, false)
    }

    Log.info('Windows native focus applied successfully')
    return true
  } catch (e) {
    Log.warning('Failed to apply Windows native focus:', e)
    return false
  }
}
