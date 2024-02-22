import { store } from '@shared/StoreController'

export function debouncer(eventId: string, event: () => any, debouncer = 100) {
  if (!store.debounceEvents[eventId]) {
    applyDebouncer(eventId, event, debouncer)
  } else {
    clearTimeout(store.debounceEvents[`${eventId}_timer`])
    applyDebouncer(eventId, event, debouncer)
  }
}

function applyDebouncer(eventId: string, event: () => any, debouncer: number) {
  store.debounceEvents[eventId] = true
  store.debounceEvents[`${eventId}_timer`] = setTimeout(() => {
    event()
    delete store.debounceEvents[eventId]
    delete store.debounceEvents[`${eventId}_timer`]
  }, debouncer)
}
