import { AccountController, NethVoiceAPI } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account } from '@shared/types'
import { app, ipcMain, shell } from 'electron'
import { join } from 'path'
import { SyncResponse } from 'src/preload'
import { log } from '@shared/utils/logger'
import { cloneDeep } from 'lodash'
import { NethLinkController } from '@/classes/controllers/NethLinkController'

function onSyncEmitter<T>(
  channel: IPC_EVENTS,
  asyncCallback: (...args: any[]) => Promise<T>
): void {
  ipcMain.on(channel, async (event, ...args) => {
    let syncResponse = [undefined, undefined] as SyncResponse<T>
    try {
      const response = await asyncCallback(...args)
      syncResponse = [response, undefined]
    } catch (e: unknown) {
      //log(e)
      syncResponse = [undefined, cloneDeep(e as Error | undefined)]
    }
    event.returnValue = syncResponse
  })
}

export function registerIpcEvents() {
  onSyncEmitter(IPC_EVENTS.LOGIN, async (...args) => {
    const [host, username, password] = args
    //log(args)
    const tempAccount: Account = {
      host,
      username,
      theme: 'system'
    }
    await AccountController.instance.login(tempAccount, password)
  })

  onSyncEmitter(IPC_EVENTS.ADD_CONTACT_PHONEBOOK, (contact) =>
    NethVoiceAPI.instance.Phonebook.createContact(contact)
  )

  onSyncEmitter(IPC_EVENTS.GET_LOCALE, async () => {
    return app.getLocale()
  })
  onSyncEmitter(IPC_EVENTS.ADD_CONTACT_SPEEDDIAL, (contact) =>
    NethVoiceAPI.instance.Phonebook.createSpeeddial(contact)
  )
  onSyncEmitter(IPC_EVENTS.EDIT_SPEEDDIAL_CONTACT, (editContact, currentContact) =>
    NethVoiceAPI.instance.Phonebook.updateSpeeddial(editContact, currentContact)
  )

  onSyncEmitter(IPC_EVENTS.DELETE_SPEEDDIAL, (contact) =>
    NethVoiceAPI.instance.Phonebook.deleteSpeeddial(contact)
  )

  ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
    AccountController.instance.logout()
  })

  ipcMain.on(IPC_EVENTS.CREATE_NEW_ACCOUNT, async (_event) => {
    log('CREATE_NEW_ACCOUNT')
  })

  ipcMain.on(IPC_EVENTS.GET_SPEED_DIALS, async (event) => {
    const speeddials = await NethVoiceAPI.instance.Phonebook.speeddials()
    event.returnValue = speeddials
  })

  ipcMain.on(IPC_EVENTS.HIDE_NETH_LINK, async (event) => {
    NethLinkController.instance.window.hideWindowFromRenderer()
  })

  ipcMain.on(IPC_EVENTS.OPEN_SPEEDDIALS_PAGE, async (_event) => {
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'phonebook'))
  })

  ipcMain.on(IPC_EVENTS.GET_LAST_CALLS, async (event) => {
    const last_calls = await NethVoiceAPI.instance.HistoryCall.interval()
    event.returnValue = last_calls
  })

  ipcMain.on(IPC_EVENTS.OPEN_ALL_CALLS_PAGE, async (_event) => {
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'history'))
  })

  ipcMain.on(IPC_EVENTS.OPEN_ADD_TO_PHONEBOOK_PAGE, async (_event) => {
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'phonebook'))
  })
  ipcMain.on(IPC_EVENTS.START_CALL, async (_event, phoneNumber) => {
    PhoneIslandController.instance.call(phoneNumber)
  })
  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_RESIZE, (event, w, h) => {
    PhoneIslandController.instance.resize(w, h)
  })
  ipcMain.on(IPC_EVENTS.LOGIN_WINDOW_RESIZE, (event, h) => {
    LoginController.instance.resize(h)
  })
  ipcMain.on(IPC_EVENTS.HIDE_LOGIN_WINDOW, () => {
    LoginController.instance.hide()
  })

  ipcMain.on(IPC_EVENTS.CHANGE_THEME, (event, theme) => {
    AccountController.instance.updateTheme(theme)
  })

  ipcMain.on(IPC_EVENTS.SEARCH_TEXT, async (event, searchText) => {
    const res = await NethVoiceAPI.instance.Phonebook.search(searchText)
    NethLinkController.instance.window.emit(IPC_EVENTS.RECEIVE_SEARCH_RESULT, res)
  })

  ipcMain.on(IPC_EVENTS.OPEN_MISSED_CALLS_PAGE, (event, url) => {
    shell.openExternal(url)
  })

  ipcMain.on(IPC_EVENTS.OPEN_NETHVOICE_PAGE, (event, url) => {
    shell.openExternal(url)
  })

  //SEND BACK ALL PHONE ISLAND EVENTS
  Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
    ipcMain.on(ev, (_event, ...args) => {
      const evName = `on-${ev}`
      log('send back', evName, ...args)
      NethLinkController.instance.window.emit(evName, ...args)
    })
  })
}
