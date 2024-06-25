import { PAGES } from "@shared/types"
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

export const getPageFromQuery = (query): keyof typeof PAGES | 'main' => {
  try {
    return query ? query.split('?')[0].split('#')[1].split('/')[1] as keyof typeof PAGES : 'main'
  } catch (e) {
    return query ? query.split('#')[1] as keyof typeof PAGES : 'main'
  }
}

export async function delay(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}


export function isDev() {
  let _isDev = false
  try {
    _isDev = window.api.env['DEV'] === 'true'
  } catch (e) {
    _isDev = process.env['DEV'] === 'true'
  }
  return _isDev
}


export const isDeepEqual = (obj1: object, obj2: object) => {
  const objKeys1 = Object.keys(obj1);
  const objKeys2 = Object.keys(obj2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = obj1[key];
    const value2 = obj2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if ((isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
}


const isObject = (object) => {
  return object != null && typeof object === "object";
};

