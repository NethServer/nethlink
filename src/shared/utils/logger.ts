import moment from 'moment'
export const log = (message?: any, ...optionalParams: any[]) => {
  const now = moment()
  //TODO: sfruttare questo helper per scrivee i log su un file
  console.log(`[${now.format('HH:MM:ss.SSSZ')}]`, message, ...optionalParams)
}
