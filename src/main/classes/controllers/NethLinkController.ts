import { Account, AvailableThemes } from '@shared/types'
import { NethLinkWindow } from '../windows'
import { IPC_EVENTS } from '@shared/constants'
import { NethVoiceAPI } from './NethCTIController'
import { delay } from '@shared/utils/utils'
import { nativeTheme } from 'electron'
import { log } from '@shared/utils/logger'

export class NethLinkController {
  static instance: NethLinkController
  window: NethLinkWindow

  constructor() {
    NethLinkController.instance = this
    this.window = new NethLinkWindow()
    this.window.addOnBuildListener(() => {
      nativeTheme.on('updated', () => {
        const updatedSystemTheme: AvailableThemes = nativeTheme.shouldUseDarkColors
          ? 'dark'
          : 'light'
        log(updatedSystemTheme)
        this.window.emit(IPC_EVENTS.ON_CHANGE_SYSTEM_THEME, updatedSystemTheme)
      })
    })
  }

  private async operatorFetchLoop() {
    this.fetchOperatorsAndEmit()
    await delay(1000 * 60 * 60 * 24)
    this.operatorFetchLoop()
  }
  private async fetchOperatorsAndEmit() {
    const operators = await NethVoiceAPI.instance.fetchOperators()
    this.window.emit(IPC_EVENTS.OPERATORS_CHANGE, operators)
  }

  private async fetchHistoryCallsAndEmit() {
    const lastCalls = await NethVoiceAPI.instance.HistoryCall.interval()
    this.window.emit(IPC_EVENTS.RECEIVE_HISTORY_CALLS, lastCalls)
  }

  private async fetchSpeeddialsAndEmit() {
    const speeddials = await NethVoiceAPI.instance.Phonebook.speeddials()
    this.window.emit(IPC_EVENTS.RECEIVE_SPEEDDIALS, speeddials)
  }

  async init(account: Account) {
    this.operatorFetchLoop()
    this.show()
    //Avviso la nethWindow che l'utente è cambiato
    this.window.emit(IPC_EVENTS.ACCOUNT_CHANGE, account)
  }

  show() {
    this.fetchOperatorsAndEmit()
    this.fetchHistoryCallsAndEmit()
    this.fetchSpeeddialsAndEmit()
    this.window.show()
  }

  hide() {
    this.window.hide()
  }
}
