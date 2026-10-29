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
      // An isolated window (the chat) has no process: the preload's env only.
      const env = typeof process !== 'undefined' ? process.env : {}
      param =
        (env[paramName] ?? import.meta.env[`VITE_${paramName}`]) === 'true'
    }
    return param
  }
}

export const isDev = getBoolEnvParam('DEV')
export const isDevTools = getBoolEnvParam('DEVTOOLS')

export const getAccountUID = (a: Account) => {
  return `${a.host}@${a.username}`
}

// Desk phones known to handle video calls, matched on the registered User-Agent
const VIDEO_PHONE_USER_AGENTS =
  /Yealink SIP-(T58|VP59)|Fanvil (V6|X7|i[0-9])|Nethesis NP-V|Akuvox|Grandstream GXV/i

/**
 * True when the extension can receive a video call: WebRTC, NethLink and the mobile app always,
 * physical phones only for known video models
 */
export function isVideoCapableExtension(extension?: {
  type?: string
  description?: string
}) {
  if (!extension) return false
  if (['webrtc', 'nethlink', 'mobile'].includes(extension.type || ''))
    return true
  return (
    extension.type === 'physical' &&
    VIDEO_PHONE_USER_AGENTS.test(extension.description || '')
  )
}
