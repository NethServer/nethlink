import moment from 'moment'
export const log = (message?: any, ...optionalParams: any[]) => {
  const now = moment()
  //TODO: exploit this helper to write the logs to a file
  console.log(`[${now.format('HH:mm:ss.SSSZ')}]`, message, ...optionalParams)
}
