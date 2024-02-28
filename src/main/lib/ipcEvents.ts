import { AccountController, NethVoiceAPI } from '@/classes/controllers'
import { LoginController } from '@/classes/controllers/LoginController'
import { PhoneIslandController } from '@/classes/controllers/PhoneIslandController'
import { NethConnectorWindow } from '@/classes/windows'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS } from '@shared/constants'
import { Account } from '@shared/types'
import { ipcMain, ipcRenderer, shell } from 'electron'
import { join } from 'path'

export function registerIpcEvents() {
  ipcMain.on(IPC_EVENTS.LOGIN, async (event, ...args) => {
    console.log('LOGIN')
    const [host, username, password] = args
    console.log(args)
    const tempAccount: Account = {
      host,
      username,
      theme: 'system'
    }
    try {
      event.returnValue = await AccountController.instance.login(tempAccount, password)
    } catch (e) {
      console.log(e)
      event.returnValue = undefined
    }
  })

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
