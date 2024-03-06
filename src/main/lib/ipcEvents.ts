import { AccountController, NethVoiceAPI } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { NethLinkWindow } from '@/classes/windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account } from '@shared/types'
import { ipcMain, shell } from 'electron'
import { join } from 'path'
import { SyncResponse } from 'src/preload'
import { log } from '@shared/utils/logger'

function onSyncEmitter<T>(channel, asyncCallback: (...args: any[]) => Promise<T>): void {
  ipcMain.on(channel, async (event, ...args) => {
    const syncResponse = [undefined, undefined] as SyncResponse<T>
    try {
      const response = await asyncCallback(...args)
      event.returnValue = [response, undefined]
    } catch (e: unknown) {
      event.returnValue = [undefined, e as Error | undefined]
    }
  })
}

export function registerIpcEvents() {
  onSyncEmitter(IPC_EVENTS.LOGIN, async (...args) => {
    const [host, username, password] = args
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
    NethLinkWindow.instance.hideWindowFromRenderer()
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
  ipcMain.on(IPC_EVENTS.MOUSE_OVER_PHONE_ISLAND, (event, isOver) => {
    const isMouseEventDisabled = !isOver
    PhoneIslandController.instance.phoneIslandWindow.ignoreMouseEvents(isMouseEventDisabled)
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
    NethLinkWindow.instance.emit(IPC_EVENTS.RECEIVE_SEARCH_RESULT, res)
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
      NethLinkWindow.instance.emit(evName, ...args)
    })
  })
}
