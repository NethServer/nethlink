import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { Log } from '@shared/utils/logger'

// Files copied from the old roaming folder on the first start: the app state
// and the renderer localStorage, which keeps the audio devices and the ringtone.
// Chromium caches are left behind: they are rebuilt on their own.
const MIGRATED_ENTRIES = [
  /^user_data\d*\.json(\.bak)?$/,
  /^available_user_data\.json(\.bak)?$/,
  /^Local Storage$/,
]

/**
 * On Windows keep the user data in %LOCALAPPDATA% instead of the default
 * %APPDATA% (Roaming).
 *
 * The roaming folder can be redirected or synced between the PCs of the same
 * user (e.g. office PC and notebook). The password is encrypted with
 * safeStorage, that is DPAPI bound to the machine and the Windows user, so a
 * blob written on one PC may not decrypt on the other, and the PCs overwrite
 * each other's state. A local folder belongs to the machine only.
 *
 * It must run before anything reads app.getPath('userData'), the store reads
 * it when its module is loaded: import this module first in main.ts.
 */
function useLocalUserData() {
  if (process.platform !== 'win32' || !process.env['LOCALAPPDATA']) {
    return
  }
  const roamingPath = app.getPath('userData')
  const localPath = path.join(
    process.env['LOCALAPPDATA'],
    path.basename(roamingPath),
  )
  if (path.resolve(roamingPath) === path.resolve(localPath)) {
    return
  }
  if (!fs.existsSync(localPath)) {
    migrate(roamingPath, localPath)
  }
  app.setPath('userData', localPath)
}

function migrate(roamingPath: string, localPath: string) {
  fs.mkdirSync(localPath, { recursive: true })
  if (!fs.existsSync(roamingPath)) {
    return
  }
  for (const entry of fs.readdirSync(roamingPath)) {
    if (!MIGRATED_ENTRIES.some((re) => re.test(entry))) {
      continue
    }
    try {
      fs.cpSync(path.join(roamingPath, entry), path.join(localPath, entry), {
        recursive: true,
      })
    } catch (e: any) {
      // a partial copy only costs a new sign in or the device choices
      Log.warning('user data migration: cannot copy', entry, e?.code || e)
    }
  }
}

try {
  useLocalUserData()
} catch (e: any) {
  // keep the default roaming folder rather than not starting at all
  Log.warning('cannot use the local user data folder', e?.code || e)
}
