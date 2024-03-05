import { AccountController, NethVoiceAPI } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { NethConnectorWindow } from '@/classes/windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account } from '@shared/types'
import { ipcMain, shell } from 'electron'
import { join } from 'path'
import { SyncResponse } from 'src/preload'

function onSyncEmitter<T>(channel, asyncCallback: (...args: any[]) => Promise<T>): void {
  ipcMain.on(channel, async (event, ...args) => {
    const syncResponse = [undefined, undefined] as SyncResponse<T>
    try {
      const response = await asyncCallback(...args)
      event.returnValue = [response, undefined]
    } catch (e: unknown) {
      console.log(e)
      event.returnValue = [undefined, e as Error | undefined]
    }
  })
}

export function registerIpcEvents() {
  onSyncEmitter(IPC_EVENTS.LOGIN, async (...args) => {
    console.log('LOGIN')
    const [host, username, password] = args
    console.log(args)
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
  onSyncEmitter(IPC_EVENTS.ADD_CONTACT_SPEEDDIAL, (contact) =>
    NethVoiceAPI.instance.Phonebook.createSpeeddial(contact)
  )

  ipcMain.on(IPC_EVENTS.LOGOUT, async (_event) => {
    console.log('LOGOUT')
    AccountController.instance.logout()
  })

  ipcMain.on(IPC_EVENTS.CREATE_NEW_ACCOUNT, async (_event) => {
    console.log('CREATE_NEW_ACCOUNT')
  })

  ipcMain.on(IPC_EVENTS.GET_SPEED_DIALS, async (event) => {
    console.log('get GET_SPEED_DIALS')
    const speeddials = await NethVoiceAPI.instance.Phonebook.speeddials()
    event.returnValue = speeddials
  })

  ipcMain.on(IPC_EVENTS.OPEN_SPEEDDIALS_PAGE, async (_event) => {
    console.log('get OPEN_SPEEDDIALS_PAGE')
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'phonebook'))
  })

  ipcMain.on(IPC_EVENTS.GET_LAST_CALLS, async (event) => {
    console.log('get GET_LAST_CALL')
    const last_calls = await NethVoiceAPI.instance.HistoryCall.interval()
    event.returnValue = last_calls
  })

  ipcMain.on(IPC_EVENTS.OPEN_ALL_CALLS_PAGE, async (_event) => {
    console.log('get OPEN_ALL_CALLS_PAGE')
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'history'))
  })

  ipcMain.on(IPC_EVENTS.OPEN_ADD_TO_PHONEBOOK_PAGE, async (_event) => {
    console.log('get OPEN_ADD_TO_PHONEBOOK_PAGE')
    const account = AccountController.instance.getLoggedAccount()
    shell.openExternal(join(account!.host, 'phonebook'))
  })
  ipcMain.on(IPC_EVENTS.START_CALL, async (_event, phoneNumber) => {
    console.log('get OPEN_PHONE_ISLAND', phoneNumber)
    PhoneIslandController.instance.call(phoneNumber)
  })
  ipcMain.on(IPC_EVENTS.PHONE_ISLAND_RESIZE, (event, w, h) => {
    console.log(event, w, h)
    PhoneIslandController.instance.resize(w, h)
  })
  ipcMain.on(IPC_EVENTS.MOUSE_OVER_PHONE_ISLAND, (event, isOver) => {
    const isMouseEventDisabled = !isOver
    PhoneIslandController.instance.phoneIslandWindow.ignoreMouseEvents(isMouseEventDisabled)
  })
  ipcMain.on(IPC_EVENTS.LOGIN_WINDOW_RESIZE, (event, h) => {
    console.log(event, h)
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
    NethConnectorWindow.instance.emit(IPC_EVENTS.RECEIVE_SEARCH_RESULT, res)
  })

  ipcMain.on(IPC_EVENTS.OPEN_MISSED_CALLS_PAGE, (event, url) => {
    shell.openExternal(url)
  })

  //SEND BACK ALL PHONE ISLAND EVENTS
  Object.keys(PHONE_ISLAND_EVENTS).forEach((ev) => {
    ipcMain.on(ev, (_event, ...args) => {
      const evName = `on-${ev}`
      console.log('received', evName, args)
      NethConnectorWindow.instance.emit(evName, ...args)
    })
  })
}
