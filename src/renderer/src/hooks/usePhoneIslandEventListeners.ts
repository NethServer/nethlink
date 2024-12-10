import { IPC_EVENTS, PHONE_ISLAND_EVENTS, getPhoneIslandSize } from "@shared/constants"
import { PhoneIslandData, PhoneIslandSizes, PhoneIslandView } from "@shared/types"
import { Log } from "@shared/utils/logger"
import { useEffect, useState } from "react"
import { t } from "i18next"
import { sendNotification } from "@renderer/utils"
import { useSharedState } from "@renderer/store"
import { useNetwork } from "@shared/useNetwork"
import http from 'http'


const defaultCall = {
  accepted: false,
  incoming: false,
  outgoing: false,
  transferring: false
}
export const usePhoneIslandEventListener = () => {
  const [account] = useSharedState('account')
  const [connected, setConnected] = useSharedState('connection')
  const { GET } = useNetwork()

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
  const [phoneIsalndSizes, setPhoneIslandSized] = useState<PhoneIslandSizes>(getPhoneIslandSize(phoneIslandData))


  const eventHandler = (event: PHONE_ISLAND_EVENTS, callback?: (data?: any) => void | Promise<void>) => ({
    [event]: (...data) => {
      const customEvent = data[0]
      const detail = customEvent['detail']
      Log.info('PHONE ISLAND', event, data, detail)
      callback?.(detail)
    }
  })

  useEffect(() => {
    const a = getPhoneIslandSize(phoneIslandData)
    Log.info('state', phoneIslandData, a)
    setPhoneIslandSized(() => ({ ...a }))
  }, [phoneIslandData])

  return {
    state: phoneIslandData,
    phoneIsalndSizes,
    events: {
      //CALLS
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-action-physical"], async (data) => {
        //const res = await GET(data.urlCallObject.url)
        Log.info('phone-island-action-physical', data.urlCallObject.url)
        window.electron.send(IPC_EVENTS.START_CALL_BY_URL, data.urlCallObject.url)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-ringing"], () => {
        setPhoneIslandData((p) => ({
          ...p, currentCall: {
            ...p.currentCall,
            incoming: true
          },
          view: PhoneIslandView.CALL
        }))
      }),

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
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-answered"], () => {
        setPhoneIslandData((p) => ({
          ...p, currentCall: {
            ...p.currentCall,
            accepted: true
          }
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-input-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-input-switched"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-output-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-audio-output-switched"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-start"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-started"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            outgoing: true
          },
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-end"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-ended"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...defaultCall
          },
          view: null
        }))
        //generate lost calls
        window.electron.send(IPC_EVENTS.EMIT_CALL_END)
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intrude"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intruded"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-closed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-opened"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          view: PhoneIslandView.KEYPAD
        }))
      }),
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

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfered"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            transferring: true
          },
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-cancel"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-canceled"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-closed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            transferring: false
          },
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-failed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            transferring: false
          },
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-opened"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            transferring: false
          },
          view: PhoneIslandView.TRANSFER
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully-popup-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-successfully-popup-open"], () => {
        sendNotification(t('Notification.call_transferred_title'), t('Notification.call_transferred_body'))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-switch"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-switched"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-attach"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-attached"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-input-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-input-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-output-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-output-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-closed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-pause"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-paused"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-play"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-played"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-start"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-audio-player-started"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-compress"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-compressed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          isOpen: false
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expand"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expanded"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          isOpen: true
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-conversations"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-changed"]),
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
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-closed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          view: PhoneIslandView.CALL
        }))
      }),
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

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-server-disconnected"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['server-disconnected']: true
          },
          currentCall: {
            ...defaultCall
          }
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-server-reloaded"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['server-disconnected']: false
          }
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-connected"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['socket-disconnected']: false
          },
          currentCall: {
            ...defaultCall
          },
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected"], () => {
        if (account && connected) {
          setConnected(false)
        }

      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-close"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {},
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-open"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['socket-disconnected']: true
          }
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-reconnected"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-changed"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-user-already-login"], () => {
        window.api.logout()
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-webrtc-registered"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-all-alerts-removed"], () => {
        setPhoneIslandData((p) => ({
          ...p,
          activeAlerts: {},
          currentCall: {
            ...defaultCall
          },
          view: null
        }))
      }),
    }
  }
}
