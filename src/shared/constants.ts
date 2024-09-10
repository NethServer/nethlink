import { Size } from "./types"
import { log } from "./utils/logger"


export const NethLinkPageSize = {
  w: 440,
  h: 440
}
export const NEW_ACCOUNT = 'New Account'

export enum MENU_ELEMENT {
  SPEEDDIALS,
  LAST_CALLS,
  ABOUT
}
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
  EDIT_SPEEDDIAL_CONTACT = 'EDIT_SPEEDDIAL_CONTACT',
  OPERATORS_CHANGE = 'OPERATORS_CHANGE',
  OPEN_DEV_TOOLS = 'OPEN_DEV_TOOLS',
  SHOW_PHONE_ISLAND = 'SHOW_PHONE_ISLAND',
  HIDE_PHONE_ISLAND = 'HIDE_PHONE_ISLAND',
  GET_LOCALE = 'GET_LOCALE',
  OPEN_HOST_PAGE = 'OPEN_HOST_PAGE',
  CLOSE_NETH_LINK = "CLOSE_NETH_LINK",
  DEVICE_DEFAULT_CHANGE = "DEVICE_DEFAULT_CHANGE",
  QUEUE_LOADED = "QUEUE_LOADED",
  UPDATE_APP_NOTIFICATION = "UPDATE_APP_NOTIFICATION",
  OPEN_EXTERNAL_PAGE = "OPEN_EXTERNAL_PAGE",
  LOAD_DATA_END = "LOAD_DATA_END",
  SEND_NOTIFICATION = "SEND_NOTIFICATION",
  UPDATE_SHARED_STATE = "UPDATE_SHARED_STATE",
  SHARED_STATE_UPDATED = "SHARED_STATE_UPDATED",
  REQUEST_SHARED_STATE = "REQUEST_SHARED_STATE",
  GET_NETHVOICE_CONFIG = "GET_NETHVOICE_CONFIG",
  SET_NETHVOICE_CONFIG = "SET_NETHVOICE_CONFIG",
  RECONNECT_PHONE_ISLAND = "RECONNECT_PHONE_ISLAND",
  LOGOUT_COMPLETED = "LOGOUT_COMPLETED",
  SHOW_NO_CONNECTION = "SHOW_NO_CONNECTION",
  UPDATE_CONNECTION_STATE = "UPDATE_CONNECTION_STATE",
  DEV_TOOL_TOGGLE_CONNECTION = "DEV_TOOL_TOGGLE_CONNECTION",
  MOVE_WINDOW = "MOVE_WINDOW",
  START_DRAG = "START_DRAG",
  STOP_DRAG = "STOP_DRAG"
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
  'phone-island-webrtc-registered' = 'phone-island-webrtc-registered',
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
  'phone-island-call-transfer-failed' = 'phone-island-call-transfer-failed',
  'phone-island-call-transfer-successfully' = 'phone-island-call-transfer-successfully',
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
  'phone-island-call-ended' = 'phone-island-call-ended',
  'phone-island-call-held' = 'phone-island-call-held',
  'phone-island-call-unheld' = 'phone-island-call-unheld',
  'phone-island-call-muted' = 'phone-island-call-muted',
  'phone-island-call-unmuted' = 'phone-island-call-unmuted',
  'phone-island-call-transfer-opened' = 'phone-island-call-transfer-opened',
  'phone-island-call-transfer-closed' = 'phone-island-call-transfer-closed',
  'phone-island-call-transfer-switched' = 'phone-island-call-transfer-switched',
  'phone-island-call-transfer-canceled' = 'phone-island-call-transfer-canceled',
  'phone-island-call-transfer-successfully-popup-open' = 'phone-island-call-transfer-successfully-popup-open',
  'phone-island-call-transfer-successfully-popup-close' = 'phone-island-call-transfer-successfully-popup-close',
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
  'phone-island-socket-reconnected' = 'phone-island-socket-reconnected',
  'phone-island-socket-disconnected-popup-open' = 'phone-island-socket-disconnected-popup-open',
  'phone-island-socket-disconnected-popup-close' = 'phone-island-socket-disconnected-popup-close',
}

function getSize(normalSize: Size, collapsedSize?: Size, minimizedSize: Size = { w: 168, h: 40 }) {
  return (isExpanded: boolean = true, isMinimized: boolean = false, isDisconnected: boolean = false): Size => {
    const size = isMinimized ? minimizedSize : ((isExpanded ? normalSize : collapsedSize) || normalSize)
    return size
  }
}

export const PHONE_ISLAND_RESIZE = new Map<string, (isExpanded: boolean, isMinimized: boolean, isDisconnected: boolean) => Size>([
  [PHONE_ISLAND_EVENTS['phone-island-server-disconnected'], getSize({ w: 420, h: 136 })],
  [PHONE_ISLAND_EVENTS['phone-island-socket-disconnected'], getSize({ w: 420, h: 136 })],
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
    getSize({ w: 350, h: 278 }, { w: 350, h: 370 }, { w: 168, h: 80 })
  ],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-transfer-failed'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [PHONE_ISLAND_EVENTS['phone-island-call-keypad-opened'], getSize({ w: 340, h: 442 }, undefined, { w: 168, h: 80 })],
  [
    PHONE_ISLAND_EVENTS['phone-island-call-keypad-closed'],
    getSize({ w: 350, h: 238 }, { w: 350, h: 306 })
  ],
  [PHONE_ISLAND_EVENTS['phone-island-call-parked'], getSize({ w: 1, h: 1 }, { w: 1, h: 1 }, { w: 1, h: 1 })]
])
