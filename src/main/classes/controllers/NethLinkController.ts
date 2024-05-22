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
  }

  private async operatorFetchLoop() {
    await delay(1000 * 60 * 60 * 24)
    await this.loadData()
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

  private async fetchQueuesAndEmit() {
    const queues = await NethVoiceAPI.instance.AstProxy.queues()
    this.window.emit(IPC_EVENTS.QUEUE_LOADED, queues)
  }

  init(account: Account) {
    this.show()
    this.window.emit(IPC_EVENTS.ACCOUNT_CHANGE, account)
    new Promise<void>(async (resolve) => {
      await this.loadData()
      this.operatorFetchLoop()
      resolve()
    }).then(() => {
      this.window.emit(IPC_EVENTS.LOAD_DATA_END)
    })
    //Avviso la nethWindow che l'utente è cambiato
  }

  async loadData() {
    await this.fetchOperatorsAndEmit()
    await this.fetchHistoryCallsAndEmit()
    await this.fetchSpeeddialsAndEmit()
    await this.fetchQueuesAndEmit()
  }
  async show() {
    this.loadData()
    this.window.show()
  }

  hide() {
    this.window.hide()
  }

  sendUpdateNotification() {
    this.window.emit(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
  }
}
