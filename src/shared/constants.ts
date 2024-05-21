import { Size } from "./types"
import { log } from "./utils/logger"


export enum IPC_EVENTS {
  LOAD_ACCOUNTS = 'LOAD_ACCOUNTS',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCOUNT_CHANGE = 'ACCOUNT_CHANGE',
  START_CALL = 'START_CALL',
  EMIT_START_CALL = 'EMIT_START_CALL',
  ON_DATA_CONFIG_CHANGE = 'ON_DATA_CONFIG_CHANGE',
  INITIALIZATION_COMPELTED = 'INITIALIZATION_COMPELTED',
  RECEIVE_SPEEDDIALS = 'RECEIVE_SPEEDDIALS',
  RECEIVE_HISTORY_CALLS = 'RECEIVE_HISTORY_CALLS',
  PHONE_ISLAND_RESIZE = 'PHONE_ISLAND_RESIZE',
  LOGIN_WINDOW_RESIZE = 'LOGIN_WINDOW_RESIZE',
  HIDE_LOGIN_WINDOW = 'HIDE_LOGIN_WINDOW',
  RECEIVE_SEARCH_RESULT = 'RECEIVE_SEARCH_RESULT',
  SEARCH_TEXT = 'SEARCH_TEXT',
  CHANGE_THEME = 'CHANGE_THEME',
  ON_CHANGE_THEME = 'ON_CHANGE_THEME',
  ON_CHANGE_SYSTEM_THEME = 'ON_CHANGE_SYSTEM_THEME',
  ADD_CONTACT_SPEEDDIAL = 'ADD_CONTACT_SPEEDDIAL',
  ADD_CONTACT_PHONEBOOK = 'ADD_CONTACT_PHONEBOOK',
  HIDE_NETH_LINK = 'HIDE_NETH_LINK',
  EDIT_SPEEDDIAL_CONTACT = 'EDIT_SPEEDDIAL_CONTACT',
  OPERATORS_CHANGE = 'OPERATORS_CHANGE',
  DELETE_SPEEDDIAL = 'DELETE_SPEEDDIAL',
  OPEN_DEV_TOOLS = 'OPEN_DEV_TOOLS',
  SHOW_PHONE_ISLAND = 'SHOW_PHONE_ISLAND',
  HIDE_PHONE_ISLAND = 'HIDE_PHONE_ISLAND',
  GET_LOCALE = 'GET_LOCALE',
  OPEN_HOST_PAGE = 'OPEN_HOST_PAGE',
  CLOSE_NETH_LINK = "CLOSE_NETH_LINK",
  DEVICE_DEFAULT_CHANGE = "DEVICE_DEFAULT_CHANGE",
  QUEUE_LOADED = "QUEUE_LOADED"
}

//PHONE ISLAND EVENTS

export enum PHONE_ISLAND_EVENTS {
  // Listen Phone-Island Events: phone-island*
  'phone-island-attach' = 'phone-island-attach',
  'phone-island-detach' = 'phone-island-detach',
  'phone-island-audio-input-change' = 'phone-island-audio-input-change',
  'phone-island-audio-output-change' = 'phone-island-audio-output-change',
  'phone-island-theme-change' = 'phone-island-theme-change',
  // Dispatch Phone-Island Events: phone-island*
  'phone-island-attached' = 'phone-island-attached',
  'phone-island-detached' = 'phone-island-detached',
  'phone-island-audio-input-changed' = 'phone-island-audio-input-changed',
  'phone-island-audio-output-changed' = 'phone-island-audio-output-changed',
  'phone-island-theme-changed' = 'phone-island-theme-changed',
  'phone-island-default-device-change' = 'phone-island-default-device-change',
  'phone-island-default-device-changed' = 'phone-island-default-device-changed',
  // Listen Call Events: phone-island-call*
  'phone-island-call-start' = 'phone-island-call-start',
  'phone-island-call-answer' = 'phone-island-call-answer',
  'phone-island-call-end' = 'phone-island-call-end',
  'phone-island-call-hold' = 'phone-island-call-hold',
  'phone-island-call-unhold' = 'phone-island-call-unhold',
  'phone-island-call-mute' = 'phone-island-call-mute',
  'phone-island-call-unmute' = 'phone-island-call-unmute',
  'phone-island-call-transfer-open' = 'phone-island-call-transfer-open',
  'phone-island-call-transfer-close' = 'phone-island-call-transfer-close',
  'phone-island-call-transfer-switch' = 'phone-island-call-transfer-switch',
  'phone-island-call-transfer-cancel' = 'phone-island-call-transfer-cancel',
  'phone-island-call-transfer' = 'phone-island-call-transfer',
  'phone-island-call-keypad-open' = 'phone-island-call-keypad-open',
  'phone-island-call-keypad-close' = 'phone-island-call-keypad-close',
  'phone-island-call-keypad-send' = 'phone-island-call-keypad-send',
  'phone-island-call-park' = 'phone-island-call-park',
  'phone-island-call-intrude' = 'phone-island-call-intrude',
  'phone-island-call-listen' = 'phone-island-call-listen',
  'phone-island-call-audio-input-switch' = 'phone-island-call-audio-input-switch',
  'phone-island-call-audio-output-switch' = 'phone-island-call-audio-output-switch',
  'phone-island-call-actions-open' = 'phone-island-call-actions-open',
  'phone-island-call-actions-close' = 'phone-island-call-actions-close',
  'phone-island-expand' = ' phone-island-expand',
  'phone-island-compress' = 'phone-island-compress',
  // Dispatch Call Event: phone-island-call-*
  'phone-island-call-ringing' = 'phone-island-call-ringing',
  'phone-island-call-started' = 'phone-island-call-started',
  'phone-island-call-answered' = 'phone-island-call-answered',
  'phone-island-call-ended' = 'phone-island-call-ended', //TODO:fare reload delle chiamate perse
  'phone-island-call-held' = 'phone-island-call-held',
  'phone-island-call-unheld' = 'phone-island-call-unheld',
  'phone-island-call-muted' = 'phone-island-call-muted',
  'phone-island-call-unmuted' = 'phone-island-call-unmuted',
  'phone-island-call-transfer-opened' = 'phone-island-call-transfer-opened',
  'phone-island-call-transfer-closed' = 'phone-island-call-transfer-closed',
  'phone-island-call-transfer-switched' = 'phone-island-call-transfer-switched',
  'phone-island-call-transfer-canceled' = 'phone-island-call-transfer-canceled',
  'phone-island-call-transfered' = 'phone-island-call-transfered',
  'phone-island-call-keypad-opened' = 'phone-island-call-keypad-opened',
  'phone-island-call-keypad-closed' = 'phone-island-call-keypad-closed',
  'phone-island-call-keypad-sent' = 'phone-island-call-keypad-sent',
  'phone-island-call-parked' = 'phone-island-call-parked',
  'phone-island-call-listened' = 'phone-island-call-listened',
  'phone-island-call-intruded' = 'phone-island-call-intruded',
  'phone-island-call-audio-input-switched' = 'phone-island-call-audio-input-switched',
  'phone-island-call-audio-output-switched' = 'phone-island-call-audio-output-switched',
  'phone-island-call-actions-opened' = 'phone-island-call-actions-opened',
  'phone-island-call-actions-closed' = 'phone-island-call-actions-closed',
  'phone-island-expanded' = 'phone-island-expanded',
  'phone-island-compressed' = 'phone-island-compressed',
  // Listen Recording Event: phone-island-recording-*
  'phone-island-recording-open' = 'phone-island-recording-open',
  'phone-island-recording-close' = 'phone-island-recording-close',
  'phone-island-recording-start' = 'phone-island-recording-start',
  'phone-island-recording-stop' = 'phone-island-recording-stop',
  'phone-island-recording-play' = 'phone-island-recording-play',
  'phone-island-recording-pause' = 'phone-island-recreateContactcording-pause',
  'phone-island-recording-save' = 'phone-island-recording-save',
  'phone-island-recording-delete' = 'phone-island-recording-delete',
  // Dispatch Recording Event: phone-island-recording-*
  'phone-island-recording-opened' = 'phone-island-recording-opened',
  'phone-island-recording-closed' = 'phone-island-recording-closed',
  'phone-island-recording-started' = 'phone-island-recording-started',
  'phone-island-recording-stopped' = 'phone-island-recording-stopped',
  'phone-island-recording-played' = 'phone-island-recording-played',
  'phone-island-recording-paused' = 'phone-island-recording-paused',
  'phone-island-recording-saved' = 'phone-island-recording-saved',
  'phone-island-recording-deleted' = 'phone-island-recording-deleted',
  // Listen Audio Player Event: phone-island-audio-player-*
  'phone-island-audio-player-start' = 'phone-island-audio-player-start',
  'phone-island-audio-player-play' = 'phone-island-audio-player-play',
  'phone-island-audio-player-pause' = 'phone-island-audio-player-pause',
  'phone-island-audio-player-close' = 'phone-island-audio-player-close',
  // Dispatch Audio Player Event: phone-island-audio-player-*
  'phone-island-audio-player-started' = 'phone-island-audio-player-started',
  'phone-island-audio-player-played' = 'phone-island-audio-player-played',
  'phone-island-audio-player-paused' = 'phone-island-audio-player-paused',
  'phone-island-audio-player-closed' = 'phone-island-audio-player-closed',
  // General Dispatch Events
  'phone-island-user-already-login' = 'phone-island-user-already-login',
  'phone-island-main-presence' = 'phone-island-main-presence',
  'phone-island-conversations' = 'phone-island-conversations',
  'phone-island-queue-update' = 'phone-island-queue-update',
  'phone-island-queue-member-update' = 'phone-island-queue-member-update',
  'phone-island-parking-update' = 'phone-island-parking-update',
  // Server and Socket Dispatch Event: phone-island-server-* | phone-island-socket-*
  'phone-island-server-reloaded' = 'phone-island-server-reloaded',
  'phone-island-server-disconnected' = 'phone-island-server-disconnected',
  'phone-island-socket-connected' = 'phone-island-socket-connected',
  'phone-island-socket-disconnected' = 'phone-island-socket-disconnected',
  'phone-island-socket-reconnected' = 'phone-island-socket-reconnected'
}

function getSize(normalSize: Size, collapsedSize?: Size, minimizedSize: Size = { w: 168, h: 40 }) {
  return (isExpanded: boolean = true, isMinimized: boolean = false): Size => {
    log(isExpanded, isMinimized, normalSize, collapsedSize, minimizedSize)
    return isMinimized ? minimizedSize : ((isExpanded ? normalSize : collapsedSize) || normalSize)
  }
}

export const PHONE_ISLAND_RESIZE = new Map<string, (isExpanded: boolean, isMinimized: boolean) => Size>([
  [PHONE_ISLAND_EVENTS['phone-island-call-ringing'], getSize({ w: 420, h: 98 })],
  [PHONE_ISLAND_EVENTS['phone-island-call-started'], getSize({ w: 420, h: 98 })],
  [PHONE_ISLAND_EVENTS['phone-island-call-actions-opened'], getSize({ w: 350, h: 306 })],
  [PHONE_ISLAND_EVENTS['phone-island-call-actions-closed'], getSize({ w: 350, h: 238 })],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-answered'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [PHONE_ISLAND_EVENTS['phone-island-call-ended'], getSize({ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 })],
  [PHONE_ISLAND_EVENTS['phone-island-call-transfer-opened'], getSize({ w: 410, h: 452 }, undefined, { w: 168, h: 80 })],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-transfer-closed'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-transfer-canceled'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-transfered'],
    getSize({ w: 350, h: 310 }, { w: 350, h: 370 })
  ],
  [PHONE_ISLAND_EVENTS['phone-island-call-keypad-opened'], getSize({ w: 340, h: 442 }, undefined, { w: 168, h: 80 })],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-keypad-closed'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [PHONE_ISLAND_EVENTS['phone-island-call-parked'], getSize({ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 })]
])
