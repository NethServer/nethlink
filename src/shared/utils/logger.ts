
import moment from 'moment'
import { isDev } from './utils';
export const log = async (message?: any, ...optionalParams: any[]) => {
  const now = moment()

  let callerLine = '';
  if (isDev()) {
    const error = new Error();
    const stack = error.stack;
    const stackLines = stack?.split('\n');
    callerLine = `[${stackLines?.[2].split('at ')[1]}] `
  }
  let formattedMessage = `${now.format('HH:mm:ss.SSSZ')} ##PAGE## ${callerLine}${typeof message === 'object'
    ? JSON.stringify(message)
    : message} ${optionalParams.map(param => typeof param === 'object'
      ? JSON.stringify(param)
      : param
    ).join(' ')}`;


  try {
    const { ipcMain } = await import('electron');
    formattedMessage = formattedMessage.replace('##PAGE##', '[backendpage]')
    ipcMain.emit('log-message', formattedMessage)
  } catch (err) {
    formattedMessage = formattedMessage.replace('##PAGE##', `[${(window.document.title + '********').substring(0, 12)}]`)
    window.electron.send('log-message', formattedMessage);
  } finally {
    console.log(formattedMessage)
  }

}
