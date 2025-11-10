import { PhoneIslandData, PhoneIslandSizes } from "./types"

export const NethLinkPageSize = {
  w: 440,
  h: 440
}

export const LoginPageSize = {
  w: 500,
  h: 300
}
export const NEW_ACCOUNT = 'New Account'

export enum FilterTypes {
  AZ = 'A-Z',
  ZA = 'Z-A',
  EXT = 'EXT',
}

export enum SpeeddialTypes {
  BASIC = 'speeddial-basic',
  FAVOURITES = 'speeddial-favorite'
}
export const GIT_RELEASES_URL = `https://api.github.com/repos/nethserver/nethlink/releases/latest`

export enum PERMISSION {
  CALL_FORWARD = 'call_forward',
  PARKINGS = 'parkings',
  DND = "dnd",
  RECORDING = "recording",
  CONFERENCE = "conference",
  SPY = "spy",
  INTRUDE = "intrude",
  PICKUP = "pickup"
}

export enum MENU_ELEMENT {
  FAVOURITES = 1,
  SPEEDDIALS,
  LAST_CALLS,
  PARKED_CALLS,
  ABOUT,
}
export enum IPC_EVENTS {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  START_CALL = 'START_CALL',
  EMIT_START_CALL = 'EMIT_START_CALL',
  INITIALIZATION_COMPELTED = 'INITIALIZATION_COMPELTED',
  PHONE_ISLAND_RESIZE = 'PHONE_ISLAND_RESIZE',
  LOGIN_WINDOW_RESIZE = 'LOGIN_WINDOW_RESIZE',
  HIDE_LOGIN_WINDOW = 'HIDE_LOGIN_WINDOW',
  CHANGE_THEME = 'CHANGE_THEME',
  ON_CHANGE_THEME = 'ON_CHANGE_THEME',
  OPEN_DEV_TOOLS = 'OPEN_DEV_TOOLS',
  SHOW_PHONE_ISLAND = 'SHOW_PHONE_ISLAND',
  HIDE_PHONE_ISLAND = 'HIDE_PHONE_ISLAND',
  GET_LOCALE = 'GET_LOCALE',
  OPEN_HOST_PAGE = 'OPEN_HOST_PAGE',
  CLOSE_NETH_LINK = "CLOSE_NETH_LINK",
  UPDATE_APP_NOTIFICATION = "UPDATE_APP_NOTIFICATION",
  OPEN_EXTERNAL_PAGE = "OPEN_EXTERNAL_PAGE",
  UPDATE_SHARED_STATE = "UPDATE_SHARED_STATE",
  SHARED_STATE_UPDATED = "SHARED_STATE_UPDATED",
  REQUEST_SHARED_STATE = "REQUEST_SHARED_STATE",
  GET_NETHVOICE_CONFIG = "GET_NETHVOICE_CONFIG",
  SET_NETHVOICE_CONFIG = "SET_NETHVOICE_CONFIG",
  RECONNECT_PHONE_ISLAND = "RECONNECT_PHONE_ISLAND",
  RECONNECT_SOCKET = "RECONNECT_SOCKET",
  LOGOUT_COMPLETED = "LOGOUT_COMPLETED",
  SHOW_NO_CONNECTION = "SHOW_NO_CONNECTION",
  UPDATE_CONNECTION_STATE = "UPDATE_CONNECTION_STATE",
  DEV_TOOL_TOGGLE_CONNECTION = "DEV_TOOL_TOGGLE_CONNECTION",
  START_DRAG = "START_DRAG",
  STOP_DRAG = "STOP_DRAG",
  ENABLE_CLICK = "ENABLE_CLICK",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  EMIT_CALL_END = "EMIT_CALL_END",
  EMIT_MAIN_PRESENCE_UPDATE = "EMIT_MAIN_PRESENCE_CHANGE",
  EMIT_QUEUE_UPDATE = "EMIT_QUEUE_UPDATE",
  EMIT_PARKING_UPDATE = "EMIT_PARKING_UPDATE",
  TRANSFER_CALL = "TRANSFER_CALL",
  CHANGE_DEFAULT_DEVICE = "CHANGE_DEFAULT_DEVICE",
  START_CALL_BY_URL = "START_CALL_BY_URL",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  RESPONSE_START_CALL_BY_URL = "RESPONSE_START_CALL_BY_URL",
  END_CALL = "END_CALL",
  RESUME = "RESUME",
  FULLSCREEN_ENTER = "FULLSCREEN_ENTER",
  FULLSCREEN_EXIT = "FULLSCREEN_EXIT",
  SCREEN_SHARE_INIT = "SCREEN_SHARE_INIT",
  SCREEN_SHARE_SOURCES = "SCREEN_SHARE_SOURCES",
  CHANGE_SHORTCUT = 'CHANGE_SHORTCUT',
  COPY_TO_CLIPBOARD = "COPY_TO_CLIPBOARD",
  CHANGE_PREFERRED_DEVICES = "CHANGE_PREFERRED_DEVICES",
  PHONE_ISLAND_READY = "PHONE_ISLAND_READY",
  URL_OPEN = "URL_OPEN",
}

//PHONE ISLAND EVENTS

export enum PHONE_ISLAND_EVENTS {
  // Listen Phone-Island Events: phone-island*
  "phone-island-size-changed" = "phone-island-size-changed",
  'phone-island-attach' = 'phone-island-attach',
  'phone-island-detach' = 'phone-island-detach',
  'phone-island-audio-input-change' = 'phone-island-audio-input-change',
  'phone-island-video-input-change' = 'phone-island-video-input-change',
  'phone-island-audio-output-change' = 'phone-island-audio-output-change',
  'phone-island-theme-change' = 'phone-island-theme-change',
  'phone-island-action-physical' = 'phone-island-action-physical',
  // Dispatch Phone-Island Events: phone-island*
  'phone-island-webrtc-registered' = 'phone-island-webrtc-registered',
  'phone-island-attached' = 'phone-island-attached',
  'phone-island-detached' = 'phone-island-detached',
  'phone-island-audio-input-changed' = 'phone-island-audio-input-changed',
  'phone-island-video-input-changed' = 'phone-island-video-input-changed',
  'phone-island-audio-output-changed' = 'phone-island-audio-output-changed',
  'phone-island-theme-changed' = 'phone-island-theme-changed',
  'phone-island-default-device-change' = 'phone-island-default-device-change',
  'phone-island-default-device-changed' = 'phone-island-default-device-changed',
  'phone-island-default-device-updated' = 'phone-island-default-device-updated',
  // Listen Call Events: phone-island-call*
  'phone-island-call-start' = 'phone-island-call-start',
  'phone-island-call-answer' = 'phone-island-call-answer',
  'phone-island-call-end' = 'phone-island-call-end',
  'phone-island-call-hold' = 'phone-island-call-hold',
  'phone-island-call-unhold' = 'phone-island-call-unhold',
  'phone-island-call-mute' = 'phone-island-call-mute',
  'phone-island-call-unmute' = 'phone-island-call-unmute',
  'phone-island-call-transfer' = 'phone-island-call-transfer',
  'phone-island-call-transfer-open' = 'phone-island-call-transfer-open',
  'phone-island-call-transfer-close' = 'phone-island-call-transfer-close',
  'phone-island-call-transfer-switch' = 'phone-island-call-transfer-switch',
  'phone-island-call-transfer-cancel' = 'phone-island-call-transfer-cancel',
  'phone-island-call-transfer-failed' = 'phone-island-call-transfer-failed',
  'phone-island-call-transfer-successfully' = 'phone-island-call-transfer-successfully',
  'phone-island-call-transfered' = 'phone-island-call-transfered',
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
  'phone-island-internet-connected' = 'phone-island-internet-connected',
  'phone-island-internet-disconnected' = 'phone-island-internet-disconnected',
  // Alerts
  'phone-island-all-alerts-removed' = 'phone-island-all-alerts-removed',
  // Videocall
  'phone-island-fullscreen-entered' = 'phone-island-fullscreen-entered',
  'phone-island-fullscreen-exited' = 'phone-island-fullscreen-exited',
  // Screen Share
  'phone-island-screen-share-initialized' = 'phone-island-screen-share-initialized',
  // Url param
  'phone-island-url-parameter-opened-external' = 'phone-island-url-parameter-opened-external',
  'phone-island-already-opened-external-page' = 'phone-island-already-opened-external-page',
  // Init audio
  'phone-island-init-audio' = 'phone-island-init-audio',
}
