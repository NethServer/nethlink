import { Account, AuthAppData, LocalStorageData } from '@shared/types'
import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { difference } from 'lodash'

const AVAILABLE_USER_DATA_PATH = path.join(
  app.getPath('userData'),
  `available_user_data.json`,
)

// on Windows the rename can transiently fail while an antivirus keeps the target open
const RENAME_RETRY_DELAYS_MS = [10, 30, 90]

function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function renameWithRetry(from: string, to: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      fs.renameSync(from, to)
      return
    } catch (e: any) {
      if (attempt >= RENAME_RETRY_DELAYS_MS.length) {
        throw e
      }
      Log.warning('rename of', from, 'failed, retrying:', e?.code || e)
      sleepSync(RENAME_RETRY_DELAYS_MS[attempt])
    }
  }
}

/**
 * NTFS journals metadata only: after an unclean shutdown the new file size can be
 * recovered from the journal while the data pages are still sitting in the page
 * cache, leaving a file of the expected length filled with 0x00. Writing to a
 * temporary file, flushing it to the platters and only then renaming it over the
 * target keeps the previous content intact until the new one is durable on disk.
 * The fsync is the load bearing part: without it the rename alone still allows a
 * NUL-filled file to show up under the final name.
 */
function writeJsonAtomic(target: string, content: string) {
  const tmp = `${target}.tmp`
  const fd = fs.openSync(tmp, 'w')
  try {
    fs.writeFileSync(fd, content)
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  try {
    if (fs.existsSync(target)) {
      fs.copyFileSync(target, `${target}.bak`)
    }
  } catch (e) {
    Log.warning('unable to refresh the backup of', target, e)
  }
  renameWithRetry(tmp, target)
}

function isAllZeroes(buffer: Buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 0) return false
  }
  return true
}

/**
 * Returns undefined - never throws - when the file is missing, empty, recovered
 * as NUL bytes after a crash, or simply not valid JSON.
 */
function parseJsonFile(filePath: string): any | undefined {
  try {
    if (!fs.existsSync(filePath)) return undefined
    const buffer = fs.readFileSync(filePath)
    if (buffer.length === 0) {
      Log.warning('STORE', filePath, 'is empty')
      return undefined
    }
    if (isAllZeroes(buffer)) {
      Log.warning(
        'STORE',
        filePath,
        'contains only NUL bytes - corrupted by an unclean shutdown',
      )
      return undefined
    }
    return JSON.parse(buffer.toString('utf-8'))
  } catch (e) {
    Log.warning('STORE unable to read', filePath, e)
    return undefined
  }
}

/**
 * The backup is consulted only when the primary file is there but unusable: a file
 * that is simply missing means a fresh install - or someone removing it on purpose to
 * force a clean login - and bringing it back from the backup would defeat that.
 */
function readJsonSafe<T>(filePath: string, fallback: T): T {
  const data = parseJsonFile(filePath)
  if (data !== undefined) return data as T
  if (fs.existsSync(filePath)) {
    const backup = parseJsonFile(`${filePath}.bak`)
    if (backup !== undefined) {
      Log.warning('STORE restored', filePath, 'from its backup')
      return backup as T
    }
  }
  Log.warning(
    'STORE no usable data for',
    filePath,
    '- falling back to defaults',
  )
  return fallback
}

class Store<T> {
  assignedInstanceID
  USER_DATA_PATH
  constructor() {
    const instance = process.argv.find((p) => p.includes('INSTANCE='))
    if (instance) {
      const i = instance?.split('=')
      this.assignedInstanceID = i[1]
    } else {
      this.assignedInstanceID = 0
    }
    Log.info({ assignedInstanceID: this.assignedInstanceID })
    this.USER_DATA_PATH = path.join(
      app.getPath('userData'),
      `user_data${this.assignedInstanceID || ''}.json`,
    )
    const hasUserData = fs.existsSync(this.USER_DATA_PATH)
    const hasAvailableUserData = fs.existsSync(AVAILABLE_USER_DATA_PATH)
    if (!hasUserData || !hasAvailableUserData) {
      if (!hasAvailableUserData) {
        // migration path for the installations where the accounts lived only in user_data.json
        const userData = readJsonSafe<Partial<LocalStorageData>>(
          this.USER_DATA_PATH,
          {},
        )
        writeJsonAtomic(
          AVAILABLE_USER_DATA_PATH,
          JSON.stringify(userData?.auth?.availableAccounts ?? {}),
        )
      }
      if (!hasUserData) {
        writeJsonAtomic(this.USER_DATA_PATH, JSON.stringify({}))
      }
    } else {
      this.store = this.getFromDisk() ?? ({} as T)
    }
  }

  store: T = {} as T

  get(selector: keyof T) {
    return this.store[selector]
  }

  set(selector: keyof T, value: any, force: boolean = false) {
    const o = Object.assign({}, this.store)
    o[selector] = value
    const diff = difference(Object.values(o), Object.values(this.store as any))
    if (diff.length > 0 || force) {
      this.store = o
      ipcMain.emit(
        IPC_EVENTS.UPDATE_SHARED_STATE,
        undefined,
        this.store,
        'main',
        selector,
      )
    }
  }

  updateStore(newState: T | null | undefined, from: string) {
    const diff = difference(
      Object.values((newState as any) || {}),
      Object.values((this.store as any) || {}),
    )
    Log.debug(
      'STORE update shared store from',
      from,
      Object.keys((newState as any) || {}),
    )
    if (diff.length > 0 || this.store === undefined) {
      this.store = Object.assign({}, newState ?? ({} as T))
    }
  }

  saveToDisk(forceSave: boolean = false) {
    const availableUserData = (this.store as LocalStorageData)?.auth
      ?.availableAccounts
    try {
      writeJsonAtomic(this.USER_DATA_PATH, JSON.stringify(this.store ?? {}))
    } catch (e) {
      Log.error('STORE unable to persist', this.USER_DATA_PATH, e)
    }
    if (Object.keys(availableUserData || {}).length > 0 || forceSave) {
      try {
        writeJsonAtomic(
          AVAILABLE_USER_DATA_PATH,
          JSON.stringify(availableUserData ?? {}),
        )
      } catch (e) {
        Log.error('STORE unable to persist', AVAILABLE_USER_DATA_PATH, e)
      }
    }
  }

  getAvailableFromDisk(): { [accountUID: string]: Account } {
    const availableUserData = readJsonSafe<{
      [accountUID: string]: Account
    } | null>(AVAILABLE_USER_DATA_PATH, null)
    if (!availableUserData || typeof availableUserData !== 'object') {
      return {}
    }
    return availableUserData
  }

  getFromDisk(): T | null {
    const data = readJsonSafe<any>(this.USER_DATA_PATH, null)
    if (!data || typeof data !== 'object') {
      Log.error(
        'retrieving user data: no usable content in',
        this.USER_DATA_PATH,
      )
      return null
    }
    const retrivedStore = data as LocalStorageData
    retrivedStore.auth = {
      ...(retrivedStore.auth ?? {}),
      availableAccounts: this.getAvailableFromDisk(),
    } as AuthAppData
    return retrivedStore as T
  }
}

export const store: Store<LocalStorageData> = new Store<LocalStorageData>()
