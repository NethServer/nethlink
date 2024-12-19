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
  END_CALL = "END_CALL"
}

//PHONE ISLAND EVENTS

export enum PHONE_ISLAND_EVENTS {
  // Listen Phone-Island Events: phone-island*
  'phone-island-attach' = 'phone-island-attach',
  'phone-island-detach' = 'phone-island-detach',
  'phone-island-audio-input-change' = 'phone-island-audio-input-change',
  'phone-island-audio-output-change' = 'phone-island-audio-output-change',
  'phone-island-theme-change' = 'phone-island-theme-change',
  'phone-island-action-physical' = 'phone-island-action-physical',
  // Dispatch Phone-Island Events: phone-island*
  'phone-island-webrtc-registered' = 'phone-island-webrtc-registered',
  'phone-island-attached' = 'phone-island-attached',
  'phone-island-detached' = 'phone-island-detached',
  'phone-island-audio-input-changed' = 'phone-island-audio-input-changed',
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
  'phone-island-all-alerts-removed' = 'phone-island-all-alerts-removed'
}

const topbarHeight = 40
const windowSpacing = {
  w: 2,
  h: 2
}
const phoneIslandSizes = {
  padding_expanded: 24,
  alert_padding_expanded: 2,
  padding_x_collapsed: 8,
  padding_y_collapsed: 16,
  border_radius_expanded: 20,
  border_radius_collapsed: 99,
  variants: {
    // Call View
    call: {
      expanded: {
        incoming: {
          width: 418,
          height: 96,
        },
        outgoing: {
          width: 418,
          height: 96,
        },
        accepted: {
          width: 348,
          height: 236,
          actionsExpanded: {
            width: 348,
            height: 304,
          },
        },
        listening: {
          width: 348,
          height: 168,
        },
        transfer: {
          width: 348,
          height: 236 + topbarHeight,
          actionsExpanded: {
            width: 348,
            height: 304 + topbarHeight,
          },
        },
      },
      collapsed: {
        width: 168,
        height: 40,
        transfer: {
          width: 168,
          height: 40 + topbarHeight,
        },
      },
    },
    // Keypad View
    keypad: {
      expanded: {
        width: 338,
        height: 400 + topbarHeight,
      },
      collapsed: {
        width: 168,
        height: 40,
      },
    },
    // Transfer View
    transfer: {
      expanded: {
        width: 408,
        height: 410 + topbarHeight,
      },
      collapsed: {
        width: 168,
        height: 40,
      },
    },
    // Audio Player View
    player: {
      expanded: {
        width: 374,
        height: 236,
      },
      collapsed: {
        width: 168,
        height: 40,
      },
    },
    // Recorder View
    recorder: {
      expanded: {
        width: 374,
        height: 256,
      },
      collapsed: {
        width: 168,
        height: 40,
      },
    },
    // Physical Recorder View
    physicalPhoneRecorder: {
      expanded: {
        width: 374,
        height: 256,
      },
      collapsed: {
        width: 168,
        height: 40,
      },
    },
    // Alerts Section
    alerts: {
      width: 418,
      height: 92,
    },
  },
}

export function getPhoneIslandSize({ view, activeAlerts, isOpen, isListen, isActionExpanded, currentCall }: PhoneIslandData): PhoneIslandSizes {
  const { accepted, transferring, incoming, outgoing } = currentCall
  // Initial size
  let size = {
    width: 0,
    height: 0,
  }
  const { variants, alert_padding_expanded, border_radius_collapsed, border_radius_expanded, padding_expanded, padding_x_collapsed, padding_y_collapsed } = phoneIslandSizes
  if (view) {
    switch (view) {
      case 'call':
        if (isOpen) {
          if (accepted && transferring) {
            if (isActionExpanded) {
              size = {
                width: variants.call.expanded.transfer.actionsExpanded.width,
                height: variants.call.expanded.transfer.actionsExpanded.height,
              }
            } else {
              size = {
                width: variants.call.expanded.transfer.width,
                height: variants.call.expanded.transfer.height,
              }
            }
          } else if (accepted && isActionExpanded) {
            size = {
              width: variants.call.expanded.accepted.actionsExpanded.width,
              height: variants.call.expanded.accepted.actionsExpanded.height,
            }
          } else if (accepted && !isListen) {
            size = {
              width: variants.call.expanded.accepted.width,
              height: variants.call.expanded.accepted.height,
            }
          } else if (accepted && isListen) {
            size = {
              width: variants.call.expanded.listening.width,
              height: variants.call.expanded.listening.height,
            }
          } else if (incoming) {
            size = {
              width: variants.call.expanded.incoming.width,
              height: variants.call.expanded.incoming.height,
            }
          } else if (outgoing) {
            size = {
              width: variants.call.expanded.outgoing.width,
              height: variants.call.expanded.outgoing.height,
            }
          }
        } else {
          if (accepted && transferring) {
            size = {
              width: variants.call.collapsed.transfer.width,
              height: variants.call.collapsed.transfer.height,
            }
          } else {
            size = {
              width: variants.call.collapsed.width,
              height: variants.call.collapsed.height,
            }
          }
        }
        break
      case 'keypad':
        if (isOpen) {
          size = {
            width: variants.keypad.expanded.width,
            height: variants.keypad.expanded.height,
          }
        } else {
          size = {
            width: variants.transfer.collapsed.width,
            height: variants.transfer.collapsed.height,
          }
        }
        break
      case 'transfer':
        if (isOpen) {
          size = {
            width: variants.transfer.expanded.width,
            height: variants.transfer.expanded.height,
          }
        } else {
          size = {
            width: variants.transfer.collapsed.width,
            height: variants.transfer.collapsed.height,
          }
        }
        break
      case 'player':
        if (isOpen) {
          size = {
            width: variants.player.expanded.width,
            height: variants.player.expanded.height,
          }
        } else {
          size = {
            width: variants.player.collapsed.width,
            height: variants.player.collapsed.height,
          }
        }
        break
      case 'recorder':
        if (isOpen) {
          size = {
            width: variants.recorder.expanded.width,
            height: variants.recorder.expanded.height,
          }
        } else {
          size = {
            width: variants.recorder.collapsed.width,
            height: variants.recorder.collapsed.height,
          }
        }
        break
      case 'physicalPhoneRecorder':
        if (isOpen) {
          size = {
            width: variants.physicalPhoneRecorder.expanded.width,
            height: variants.physicalPhoneRecorder.expanded.height,
          }
        } else {
          size = {
            width: variants.physicalPhoneRecorder.collapsed.width,
            height: variants.physicalPhoneRecorder.collapsed.height,
          }
        }
        break
    }
  }
  const isAlert = Object.values(activeAlerts).reduce((p, c) => c ? ++p : p, 0) > 0
  //add electron window padding
  if (size.width) size.width += windowSpacing.w
  if (size.height) size.height += windowSpacing.h
  return {
    size: {
      w: size.width === 0 && isAlert ? variants.alerts.width : size.width,
      h:
        // If there is an alert and the island is open put the correct height
        isAlert && isOpen
          ? variants.alerts.height + (size.height === 0 ? alert_padding_expanded * 2 : alert_padding_expanded)
          : size.height
    },
    borderRadius: isOpen ? border_radius_expanded : border_radius_collapsed,
    padding: isOpen
      ? `${padding_expanded}px`
      : `${padding_x_collapsed}px ${padding_y_collapsed}px`,
  }
}
