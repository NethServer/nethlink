import { LocalStorageData } from '@shared/types';
import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { IPC_EVENTS } from '@shared/constants';
import { log } from '@shared/utils/logger';
import { difference, differenceBy, differenceWith } from 'lodash';

const USER_DATA_PATH = path.join(app.getPath("userData"), 'user_data.json');

class Store<T> {

  constructor() {
    if (!fs.existsSync(USER_DATA_PATH)) {
      fs.writeFileSync(USER_DATA_PATH, JSON.stringify({}))
    } else {
      this.store = this.getFromDisk()
    }
  }

  store: T = {} as T

  get(selector: keyof T) {
    return this.store[selector]
  }

  set(selector: keyof T, value: any) {
    const o = Object.assign({}, this.store)
    o[selector] = value
    const diff = difference(Object.values(o), Object.values(this.store as any))
    //log('difference', selector, diff.length)
    if (diff.length > 0) {
      this.store = o
      ipcMain.emit(IPC_EVENTS.UPDATE_SHARED_STATE, undefined, this.store, 'main', selector)
    }
  }

  updateStore(newState: T, from: string) {
    const diff = difference(Object.values(newState as any), Object.values(this.store as any))
    //log('try update store from', from, diff.length)
    if (diff.length > 0) {
      this.store = Object.assign({}, newState)
    }
  }

  saveToDisk() {
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(this.store));
  }

  getFromDisk() {
    try {
      const data = fs.readFileSync(USER_DATA_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      log('Error retrieving user data', error);
      // you may want to propagate the error, up to you
      return null;
    }
  }
}

export const store: Store<LocalStorageData> = new Store<LocalStorageData>()
export function useStoreState<T>(selector: keyof LocalStorageData): [T | undefined, (arg0: T | ((ex: T) => T | undefined) | undefined) => void] {

  const setter = (arg0: (T | undefined) | ((ex: T) => T | undefined)) => {
    let v: T | undefined = arg0 as (T | undefined)
    if (typeof arg0 === 'function') {
      v = (arg0 as (ex: T | undefined) => T | undefined)(store.store[selector] as T | undefined)
    }
    store.set(selector, v)
  }

  return [
    store.get(selector) as T | undefined,
    setter
  ]
}



