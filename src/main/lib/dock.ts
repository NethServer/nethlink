import { app } from 'electron'
import { Log } from '@shared/utils/logger'
import { LoginController } from '@/classes/controllers/LoginController'
import { NethLinkController } from '@/classes/controllers/NethLinkController'

// NethLink lives in the menu bar without a Dock icon. While the login or the
// main window is open, the icon is shown: without it macOS leaves the app out
// of the Dock and of Cmd+Tab
export function syncDockWithWindows() {
  if (process.platform !== 'darwin' || !app.dock) return
  const isAnyWindowOpen =
    !!LoginController.instance?.window?.isOpen() ||
    !!NethLinkController.instance?.window?.isOpen()
  if (isAnyWindowOpen && !app.dock.isVisible()) {
    app.dock.show().catch((e) => Log.warning('cannot show the Dock icon', e))
  } else if (!isAnyWindowOpen && app.dock.isVisible()) {
    app.dock.hide()
  }
}
