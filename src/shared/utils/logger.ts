
import moment from 'moment'
import { isDev } from './utils';
export const log = async (message?: any, ...optionalParams: any[]) => {

  if (isDev()) {
    const now = moment()
    let callerLine = '';
    const error = new Error();
    const stack = error.stack;
    const stackLines = stack?.split('\n');

    let formattedMessage = `${now.format('HH:mm:ss.SSSZ')} ##PAGE## ${callerLine}${typeof message === 'object'
      ? JSON.stringify(message)
      : message} ${optionalParams.map(param => typeof param === 'object'
        ? JSON.stringify(param)
        : param
      ).join(' ')}`;

    const pageMaxSplit = 20
    const ast = Array(pageMaxSplit).fill(1).map(() => '*').join('')
    try {
      const { ipcMain } = await import('electron');
      formattedMessage = formattedMessage.replace('##PAGE##', `[${('backendpage'.concat(ast)).substring(0, pageMaxSplit)}]`)
      ipcMain.emit('log-message', formattedMessage)
    } catch (err) {
      formattedMessage = formattedMessage.replace('##PAGE##', `[${(window.document.title.concat(ast)).substring(0, pageMaxSplit)}]`)
      window.electron.send('log-message', formattedMessage);
    } finally {
      console.log(formattedMessage)
    }
  }

}
