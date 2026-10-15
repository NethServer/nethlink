import { Account, PAGES } from '@shared/types'
import { Log } from './logger'

const debounceEvents = {}
export function debouncer(eventId: string, event: () => any, debouncer = 100) {
  if (!debounceEvents[eventId]) {
    applyDebouncer(eventId, event, debouncer)
  } else {
    clearTimeout(debounceEvents[`${eventId}_timer`])
    applyDebouncer(eventId, event, debouncer)
  }
}

function applyDebouncer(eventId: string, event: () => any, debouncer: number) {
  debounceEvents[eventId] = true
  debounceEvents[`${eventId}_timer`] = setTimeout(() => {
    try {
      event()
    } catch (e) {
      Log.warning('error in debouncer:', e)
    }
    debounceEvents[eventId] = undefined
    debounceEvents[`${eventId}_timer`] = undefined
  }, debouncer)
}

export const getPageFromQuery = (query): keyof typeof PAGES | 'main' => {
  try {
    return query
      ? (query.split('?')[0].split('#')[1].split('/')[1] as keyof typeof PAGES)
      : 'main'
  } catch (e) {
    return query ? (query.split('#')[1] as keyof typeof PAGES) : 'main'
  }
}

export async function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

function getBoolEnvParam(paramName: string) {
  return () => {
    let param = false
    try {
      param = window.api.env[paramName] === 'true'
    } catch (e) {
      param =
        (process.env[paramName] ?? import.meta.env[`VITE_${paramName}`]) ===
        'true'
    }
    return param
  }
}

export const isDev = getBoolEnvParam('DEV')
export const isDevTools = getBoolEnvParam('DEVTOOLS')

export const getAccountUID = (a: Account) => {
  return `${a.host}@${a.username}`
}
