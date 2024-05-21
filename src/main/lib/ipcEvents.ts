import { AccountController, DevToolsController, NethVoiceAPI } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account } from '@shared/types'
import { app, ipcMain, shell } from 'electron'
import { join } from 'path'
import { log } from '@shared/utils/logger'
import { cloneDeep } from 'lodash'
import { NethLinkController } from '@/classes/controllers/NethLinkController'
import { AppController } from '@/classes/controllers/AppController'
import moment from 'moment'

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
      log(e)
      syncResponse = [undefined, error]
    }
    event.returnValue = syncResponse
  })
}

export function registerIpcEvents() {
  //TODO: spostare ogni evento nel controller di appartenenza
  onSyncEmitter(IPC_EVENTS.LOGIN, async (...args) => {
    const [host, username, password] = args
    //log(args)
    const tempAccount: Account = {
      host,
      username,
      theme: 'system'
    }
    return await AccountController.instance.login(tempAccount, password)
  })

  onSyncEmitter(IPC_EVENTS.ADD_CONTACT_PHONEBOOK, (contact) =>
    NethVoiceAPI.instance.Phonebook.createContact(contact)
  )

  onSyncEmitter(IPC_EVENTS.GET_LOCALE, async () => {
    return app.getSystemLocale()
  })
  onSyncEmitter(IPC_EVENTS.ADD_CONTACT_SPEEDDIAL, async (contact) => {
    await NethVoiceAPI.instance.Phonebook.createSpeeddial(contact)
    const speeddials = await NethVoiceAPI.instance.Phonebook.speeddials()
    return speeddials
  }
  )
  onSyncEmitter(IPC_EVENTS.EDIT_SPEEDDIAL_CONTACT, (editContact, currentContact) =>
    NethVoiceAPI.instance.Phonebook.updateSpeeddial(editContact, currentContact)
  )

  onSyncEmitter(IPC_EVENTS.DELETE_SPEEDDIAL, (contact) =>
    NethVoiceAPI.instance.Phonebook.deleteSpeeddial(contact)
  )

  onSyncEmitter(IPC_EVENTS.DEVICE_DEFAULT_CHANGE, (deviceIdInformation) => new Promise(async (resolve, reject) => {
    try {
      const d = await NethVoiceAPI.instance.User.default_device(deviceIdInformation)
      await NethVoiceAPI.instance.User.me()
      resolve(d)
    } catch (e) {
      reject(e)
    }
  })

  )

  ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
    AccountController.instance.logout()
  })

  ipcMain.on(IPC_EVENTS.HIDE_NETH_LINK, async (event) => {
    NethLinkController.instance.window.hideWindowFromRenderer()
  })

  ipcMain.on(IPC_EVENTS.CLOSE_NETH_LINK, async (event) => {
    AppController.safeQuit()
  })

  ipcMain.on(IPC_EVENTS.OPEN_HOST_PAGE, async (_, path) => {
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, path))
  })

  ipcMain.on(IPC_EVENTS.START_CALL, async (_event, phoneNumber) => {
    PhoneIslandController.instance.call(phoneNumber)
  })
  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_RESIZE, (event, w, h) => {
    PhoneIslandController.instance.resize(w, h)
  })
  ipcMain.on(IPC_EVENTS.SHOW_PHONE_ISLAND, (event) => {
    PhoneIslandController.instance.showPhoneIsland()
  })
  ipcMain.on(IPC_EVENTS.HIDE_PHONE_ISLAND, (event) => {
    PhoneIslandController.instance.hidePhoneIsland()
  })
  ipcMain.on(IPC_EVENTS.LOGIN_WINDOW_RESIZE, (event, h) => {
    LoginController.instance.resize(h)
  })
  ipcMain.on(IPC_EVENTS.HIDE_LOGIN_WINDOW, () => {
    LoginController.instance.hide()
  })

  ipcMain.on(IPC_EVENTS.CHANGE_THEME, (event, theme) => {
    AccountController.instance.updateTheme(theme)
    PhoneIslandController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    LoginController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    DevToolsController.instance?.window?.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
    NethLinkController.instance.window.emit(IPC_EVENTS.ON_CHANGE_THEME, theme)
  })

  ipcMain.on(IPC_EVENTS.SEARCH_TEXT, async (event, searchText) => {
    const res = await NethVoiceAPI.instance.Phonebook.search(searchText)
    NethLinkController.instance.window.emit(IPC_EVENTS.RECEIVE_SEARCH_RESULT, res)
  })

  //SEND BACK ALL PHONE ISLAND EVENTS
  Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
    ipcMain.on(ev, async (_event, ...args) => {
      const evName = `on-${ev}`
      log('send back', evName, ...args)
      NethLinkController.instance.window.emit(evName, ...args)
      switch (ev) {
        case PHONE_ISLAND_EVENTS['phone-island-call-answered']:
        case PHONE_ISLAND_EVENTS['phone-island-call-started']:
          const account = AccountController.instance.getLoggedAccount()
          const nethlinkExtension = account!.data!.endpoints.extension.find((el) => el.type === 'nethlink')
          NethVoiceAPI.instance.User.heartbeat(`${nethlinkExtension!.id}`)
          break;
        case PHONE_ISLAND_EVENTS['phone-island-call-ended']:
          NethLinkController.instance.loadData()
          break;
        case PHONE_ISLAND_EVENTS['phone-island-default-device-changed']:
          const me = await NethVoiceAPI.instance.User.me()
          NethLinkController.instance.window.emit(IPC_EVENTS['ACCOUNT_CHANGE'], me)
          PhoneIslandController.instance.window.emit(IPC_EVENTS['ACCOUNT_CHANGE'], me)
          break;
      }
      // if (ev === PHONE_ISLAND_EVENTS['phone-island-call-answered']) {
      //   const username = AccountController.instance.getLoggedAccount()?.username
      //   if (username) {
      //     log(Object.keys(args[0]?.[username]?.conversations || {}).length > 0)
      //   }
      // }
    })
  })
}
