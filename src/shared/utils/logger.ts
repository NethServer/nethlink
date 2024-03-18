import moment from 'moment'
export const log = (message?: any, ...optionalParams: any[]) => {
  const now = moment()
  console.log(`[${now.format('HH:MM:ss.SSSZ')}]`, message, ...optionalParams)
}
