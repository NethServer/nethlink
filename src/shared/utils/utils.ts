import { log } from "./logger"

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
      log(e)
    }
    debounceEvents[eventId] = undefined
    debounceEvents[`${eventId}_timer`] = undefined
  }, debouncer)
}

export async function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}
