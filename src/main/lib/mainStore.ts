import { Account, LocalStorageData } from '@shared/types';
import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC_EVENTS } from '@shared/constants';
import { log } from '@shared/utils/logger';
import { difference, differenceBy, differenceWith } from 'lodash';

const USER_DATA_PATH = path.join(app.getPath("userData"), 'user_data.json');
const AVAILABLE_USER_DATA_PATH = path.join(app.getPath("userData"), 'available_user_data.json');

class Store<T> {


  constructor() {
    if (!fs.existsSync(USER_DATA_PATH) || !fs.existsSync(AVAILABLE_USER_DATA_PATH)) {
      if (!fs.existsSync(AVAILABLE_USER_DATA_PATH)) {
        if (!fs.existsSync(USER_DATA_PATH)) {
          fs.writeFileSync(AVAILABLE_USER_DATA_PATH, JSON.stringify({}))
        } else {
          const data = fs.readFileSync(USER_DATA_PATH, 'utf-8');
          const retrivedStore: LocalStorageData = JSON.parse(data);
          if (retrivedStore.auth?.availableAccounts) {
            fs.writeFileSync(AVAILABLE_USER_DATA_PATH, JSON.stringify(retrivedStore.auth!.availableAccounts))
          } else {
            fs.writeFileSync(AVAILABLE_USER_DATA_PATH, JSON.stringify({}))
          }
        }
      }
      !fs.existsSync(USER_DATA_PATH) && fs.writeFileSync(USER_DATA_PATH, JSON.stringify({}))
    } else {
      this.store = this.getFromDisk()
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
    log({ diff })
    if (diff.length > 0 || force) {
      this.store = o
      ipcMain.emit(IPC_EVENTS.UPDATE_SHARED_STATE, undefined, this.store, 'main', selector)
    }
  }

  updateStore(newState: T, from: string) {
    const diff = difference(Object.values(newState as any || {}), Object.values(this.store as any || {}))
    if (diff.length > 0 || this.store === undefined) {
      this.store = Object.assign({}, newState)
    }
  }

  saveToDisk(forceSave: boolean = false) {
    const availableUserData = (this.store as LocalStorageData).auth?.availableAccounts
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(this.store));
    if (Object.keys(availableUserData || {}).length > 0 || forceSave) {
      fs.writeFileSync(AVAILABLE_USER_DATA_PATH, JSON.stringify(availableUserData));
    }
  }

  getAvailableFromDisk(): { [accountUID: string]: Account; } {
    if (fs.existsSync(AVAILABLE_USER_DATA_PATH)) {
      const availableUserData = fs.readFileSync(AVAILABLE_USER_DATA_PATH, 'utf-8');
      return JSON.parse(availableUserData)
    }
    return {}
  }

  getFromDisk() {
    try {
      const data = fs.readFileSync(USER_DATA_PATH, 'utf-8');
      const availableUserData = fs.readFileSync(AVAILABLE_USER_DATA_PATH, 'utf-8');
      const retrivedStore = JSON.parse(data);
      (retrivedStore as LocalStorageData).auth!.availableAccounts = JSON.parse(availableUserData)
      return retrivedStore
    } catch (error) {
      log('Error retrieving user data', error);
      // you may want to propagate the error, up to you
      return null;
    }
  }
}

export const store: Store<LocalStorageData> = new Store<LocalStorageData>()



