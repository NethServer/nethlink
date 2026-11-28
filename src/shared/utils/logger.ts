import moment from 'moment'
import { isDev } from './utils'

type LogLevel = 'INFO' | 'DEBUG' | 'WARNING' | 'ERROR'

// JSON.stringify turns an Error into {}: keep its name and message
function formatParam(param: any): string {
  if (param instanceof Error) {
    return `${param.name}: ${param.message}`
  }
  if (typeof param === 'object') {
    try {
      return JSON.stringify(param)
    } catch {
      return String(param)
    }
  }
  return param
}

export class Log {
  private static log = async (
    consoleFunc: (...args: any[]) => void,
    level: LogLevel,
    message?: any,
    ...optionalParams: any[]
  ) => {
    // in production only warnings and errors reach the log file, so that the
    // problems on the customers' PCs can be diagnosed without filling it
    if (isDev() || level === 'WARNING' || level === 'ERROR') {
      const now = moment()
      const callerLine = ''

      let formattedMessage = `${now.format('HH:mm:ss.SSSZ')} ##PAGE## ${callerLine}${level} ${formatParam(
        message,
      )} ${optionalParams.map(formatParam).join(' ')}`

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
        // emit has no real event: the listener reads the message as 2nd argument
        ipcMain.emit('log-message', {}, formattedMessage)
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
    if (process.env['DEBUG'])
      Log.log(console.debug, 'DEBUG', message, ...optionalParams)
  }

  static warning(message?: any, ...optionalParams: any[]) {
    Log.log(console.warn, 'WARNING', message, ...optionalParams)
  }

  static error(message?: any, ...optionalParams: any[]) {
    Log.log(console.error, 'ERROR', message, ...optionalParams)
  }
}
