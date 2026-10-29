import moment from 'moment'
import { isDev } from './utils'

export class Log {
  private static log = async (
    consoleFunc: (...args: any[]) => void,
    message?: any,
    ...optionalParams: any[]
  ) => {
    if (isDev()) {
      const now = moment()
      const callerLine = ''

      let formattedMessage = `${now.format('HH:mm:ss.SSSZ')} ##PAGE## ${callerLine}${
        typeof message === 'object' ? JSON.stringify(message) : message
      } ${optionalParams
        .map((param) =>
          typeof param === 'object' ? JSON.stringify(param) : param,
        )
        .join(' ')}`

      const pageMaxSplit = 20
      const ast = Array(pageMaxSplit)
        .fill(1)
        .map(() => '*')
        .join('')
      try {
        const { ipcMain } = await import('electron')
        formattedMessage = formattedMessage.replace(
          '##PAGE##',
          `[${'backendpage'.concat(ast).substring(0, pageMaxSplit)}]`,
        )
        ipcMain.emit('log-message', formattedMessage)
      } catch (err) {
        formattedMessage = formattedMessage.replace(
          '##PAGE##',
          `[${window.document.title.concat(ast).substring(0, pageMaxSplit)}]`,
        )
        window.electron.send('log-message', formattedMessage)
      } finally {
        consoleFunc(formattedMessage)
      }
    }
  }

  static info(message?: any, ...optionalParams: any[]) {
    Log.log(console.info, 'INFO', message, ...optionalParams)
  }

  static debug(message?: any, ...optionalParams: any[]) {
    // An isolated window (the chat) has no process: the preload's env instead.
    const env =
      typeof process !== 'undefined'
        ? process.env
        : ((globalThis as any).api?.env ?? {})
    if (env['DEBUG'])
      Log.log(console.debug, 'DEBUG', message, ...optionalParams)
  }

  static warning(message?: any, ...optionalParams: any[]) {
    Log.log(console.warn, 'WARNING', message, ...optionalParams)
  }

  static error(message?: any, ...optionalParams: any[]) {
    Log.log(console.error, 'ERROR', message, ...optionalParams)
  }
}
