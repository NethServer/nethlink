import {
  IPC_EVENTS, PHONE_ISLAND_EVENTS,
} from "@shared/constants"
import {
  PhoneIslandData,
  PhoneIslandSizes,
} from "@shared/types"
import { Log } from "@shared/utils/logger"
import { useState } from "react"
import { t } from "i18next"
import { sendNotification } from "@renderer/utils"
import { useSharedState } from "@renderer/store"


const defaultSize: PhoneIslandSizes = {
  sizes: {
    width: '0px',
    height: '0px'
  }
}
const defaultCall = {
  accepted: false,
  incoming: false,
  outgoing: false,
  transferring: false
}

export const usePhoneIslandEventListener = () => {
  const [account] = useSharedState('account')
  const [connected, setConnected] = useSharedState('connection')
  const [availableRingtones, setAvailableRingtones] = useSharedState('availableRingtones')

  const [phoneIslandData, setPhoneIslandData] = useState<PhoneIslandData>({
    activeAlerts: {},
    currentCall: {
      ...defaultCall
    },
    isActionExpanded: false,
    isListen: false,
    isOpen: true,
    view: null
  })
  const [phoneIsalndSizes, setPhoneIslandSizes] = useState<PhoneIslandSizes>(defaultSize)


  const eventHandler = (event: PHONE_ISLAND_EVENTS, callback?: (data?: any) => void | Promise<void>) => ({
    [event]: (...data) => {
      const customEvent = data[0]
      const detail = customEvent['detail']
      // Don't log ringtone list response details (contains large base64 data)
      if (event !== PHONE_ISLAND_EVENTS["phone-island-ringing-tone-list-response"]) {
        Log.debug('PHONE ISLAND', event, data, detail)
      } else {
        Log.debug('PHONE ISLAND', event, '(ringtone data omitted)')
      }
      callback?.(detail)
    }
  })

  return {
    state: phoneIslandData,
    phoneIsalndSizes,
    events: {
      //SIZE CHANGE
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-size-changed"], (data) => {
        setPhoneIslandSizes(() => ({ ...data }))
      }),
      //CALLS
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-action-physical"], async (data) => {
        window.electron.send(IPC_EVENTS.START_CALL_BY_URL, data.urlCallObject.url)
        Log.debug('phone-island-action-physical', data.urlCallObject.url)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-ringing"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-hold"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-held"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-unheld"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-unhold"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-closed"], () => {
        setPhoneIslandData((p) => ({ ...p, isActionExpanded: false }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-opened"], () => {
        setPhoneIslandData((p) => ({ ...p, isActionExpanded: true }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-answer"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-answered"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-input-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-input-switched"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-output-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-output-switched"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-start"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-started"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-end"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-ended"], () => {
        window.electron.send(IPC_EVENTS.EMIT_CALL_END)
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intrude"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intruded"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-closed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-opened"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-send"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-sent"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-listen"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-listened"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-mute"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-muted"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-unmute"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-unmuted"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-park"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-parked"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfered"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-cancel"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-canceled"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-closed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-failed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-opened"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully-popup-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully-popup-open"],
        () => {
          sendNotification(
            t('Notification.call_transferred_title'),
            t('Notification.call_transferred_body')
          )
        }
      ),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-switched"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-attach"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-attached"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-input-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-input-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-output-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-output-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-video-input-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-video-output-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-closed"], () => {
        window.electron.send(IPC_EVENTS.AUDIO_PLAYER_CLOSED)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-pause"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-paused"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-play"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-played"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-start"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-started"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-compress"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-compressed"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expand"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expanded"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-conversations"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-updated"], (e) => {
        Log.debug('"phone-island-default-device-updated', e)
        window.electron.send(IPC_EVENTS.UPDATE_ACCOUNT)
      }), //update the status of device from server
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-detach"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-detached"]),



      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-main-presence"], (data) => {
        window.electron.send(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, data)
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-parking-update"], () => {
        window.electron.send(IPC_EVENTS.EMIT_PARKING_UPDATE)
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-queue-member-update"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-queue-update"], (data) => {
        window.electron.send(IPC_EVENTS.EMIT_QUEUE_UPDATE, data)
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-closed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-delete"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-deleted"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-opened"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-pause"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-paused"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-play"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-played"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-save"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-saved"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-start"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-started"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-stop"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-stopped"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-server-disconnected"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-server-reloaded"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-connected"], () => {
        setConnected(true)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-reconnected"], () => {
        window.electron.send(IPC_EVENTS.RECONNECT_SOCKET)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-internet-connected"], () => {
        if (account && !connected) {
          setConnected(true)
        }
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-internet-disconnected"], () => {
        if (account && connected) {
          setConnected(false)
        }
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-changed"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-user-already-login"], () => {
        window.api.logout()
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-webrtc-registered"], () => {
        setTimeout(() => {
          Log.info("phone-island-webrtc-registered", "send PHONE_ISLAND_READY event")
          window.electron.send(IPC_EVENTS.PHONE_ISLAND_READY)

          // Request ringtone list from phone-island
          Log.info("Requesting ringtone list from phone-island")
          const ringtoneListEvent = new CustomEvent(PHONE_ISLAND_EVENTS['phone-island-ringing-tone-list'], {})
          window.dispatchEvent(ringtoneListEvent)
        }, 500);
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-all-alerts-removed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-fullscreen-entered"], () => {
        window.electron.send(IPC_EVENTS.FULLSCREEN_ENTER)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-fullscreen-exited"], () => {
        window.electron.send(IPC_EVENTS.FULLSCREEN_EXIT)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-screen-share-initialized"], () => {
        window.electron.send(IPC_EVENTS.SCREEN_SHARE_INIT)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-url-parameter-opened-external"], (data) => {
        window.electron.send(IPC_EVENTS.URL_OPEN, data.formattedUrl)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-already-opened-external-page"]),

      // Ringtone events
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-ringing-tone-list-response"], (data) => {
        const ringtoneList = data?.ringtones || []
        Log.info('Received', ringtoneList.length, 'ringtones from phone-island')

        setAvailableRingtones(ringtoneList.map((r: any) => ({
          name: r.name,
          base64: r.base64Audio || r.base64 || ''
        })))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-ringing-tone-selected"], (data) => {
        Log.info('Phone-island confirmed ringtone selected:', data?.name)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-ringing-tone-output-changed"], (data) => {
        Log.info('Phone-island confirmed output device changed:', data?.deviceId)
      }),
    }
  }
}
