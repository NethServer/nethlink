import { PERMISSION, PHONE_ISLAND_EVENTS, getPhoneIslandSize } from "@shared/constants"
import { Account, CallData, PhoneIslandData, PhoneIslandSizes, PhoneIslandView } from "@shared/types"
import { log } from "@shared/utils/logger"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePhoneIslandEventHandler } from "./usePhoneIslandEventHandler"
import { useAccount } from "./useAccount"
import { useLoggedNethVoiceAPI } from "./useLoggedNethVoiceAPI"
import { t } from "i18next"
import { sendNotification } from "@renderer/utils"
import { differenceWith } from "lodash"
import { useStoreState } from "@renderer/store"
import { useRefState } from "./useRefState"
import { getTimeDifference } from "@renderer/lib/dateTime"
import { format, utcToZonedTime } from "date-fns-tz"

const defaultCall = {
  accepted: false,
  incoming: false,
  outgoing: false,
  transferring: false
}
export const usePhoneIslandEventListener = () => {
  const [account] = useStoreState<Account | undefined>('account')
  const { hasPermission } = useAccount()
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const {
    onMainPresence,
    onQueueUpdate,
    onParkingsUpdate,
  } = usePhoneIslandEventHandler()

  const [lastCalls, setLastCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('lastCalls'))
  const [missedCalls, setMissedCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('missedCalls'))
  const [connected, setConnected] = useRefState<boolean>(useStoreState<boolean>('connection'))

  const [state, setState] = useState<PhoneIslandData>({
    activeAlerts: {},
    currentCall: {
      ...defaultCall
    },
    isActionExpanded: false,
    isListen: false,
    isOpen: true,
    view: null
  })

  const [phoneIsalndSizes, setPhoneIslandSized] = useState<PhoneIslandSizes>(getPhoneIslandSize(state))

  const eventHandler = (event: PHONE_ISLAND_EVENTS, callback?: (data?: any) => void | Promise<void>) => ({
    [event]: useCallback(async (...data) => {
      const customEvent = data[0]
      const detail = customEvent['detail']
      log(event)
      await callback?.(detail)
    }, [state])
  })

  useEffect(() => {
    const a = getPhoneIslandSize(state)
    log({ a, state })
    setPhoneIslandSized(() => ({ ...a }))

  }, [state])


  const gestLastCalls = (newLastCalls: {
    count: number, rows: CallData[]
  }) => {

    const diffValueConversation = (diffValueOriginal: any) => {
      // determine the sign
      const sign = diffValueOriginal >= 0 ? '+' : '-'
      // convert hours to string and pad with leading zeros if necessary
      const hours = Math.abs(diffValueOriginal).toString().padStart(2, '0')
      // minutes are always '00'
      const minutes = '00'
      return `${sign}${hours}${minutes}`
    }

    const diff = differenceWith(newLastCalls.rows, lastCalls.current || [], (a, b) => a.uniqueid === b.uniqueid)
    const _missedCalls: CallData[] = [
      ...(missedCalls.current || [])
    ]
    let missed: CallData[] = []
    if (diff.length > 0) {
      diff.forEach((c) => {
        if (c.direction === 'in' && c.disposition === 'NO ANSWER') {
          _missedCalls.push(c)
          const differenceBetweenTimezone = diffValueConversation(getTimeDifference(account!, false))
          const timeDiff = format(utcToZonedTime(c.time! * 1000, differenceBetweenTimezone), 'HH:mm')
          sendNotification(t('Notification.lost_call_title', { user: c.cnam || c.ccompany || c.src || t('Common.Unknown') }), t('Notification.lost_call_body', { number: c.src, datetime: timeDiff }))
        }
      })

      setMissedCalls((p) => {
        const pmap = p?.map((c) => c.uniqueid) || []
        missed = [
          ...(p || []),
          ..._missedCalls.filter((c) => !pmap.includes(c.uniqueid))
        ]
        return missed
      })
    }
    setLastCalls(newLastCalls.rows)
  }

  return {
    state,
    phoneIsalndSizes,
    events: {
      //CALLS
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-ringing"], () => {
        setState((p) => ({
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
        setState((p) => ({ ...p, isActionExpanded: false }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-actions-opened"], () => {
        setState((p) => ({ ...p, isActionExpanded: true }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-answer"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-answered"], () => {
        setState((p) => ({
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
        setState((p) => ({
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
        setState((p) => ({ ...p, currentCall: { ...defaultCall }, view: null }))
        NethVoiceAPI.HistoryCall.interval().then((newLastCalls: {
          count: number, rows: CallData[]
        }) => {
          gestLastCalls(newLastCalls)
        })
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intrude"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-intruded"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-closed"], () => {
        setState((p) => ({
          ...p,
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-open"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-keypad-opened"], () => {
        setState((p) => ({
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
        setState((p) => ({
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
        setState((p) => ({
          ...p,
          currentCall: {
            ...p.currentCall,
            transferring: false
          },
          view: PhoneIslandView.CALL
        }))
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-call-transfer-failed"], () => {
        setState((p) => ({
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
        setState((p) => ({
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
        setState((p) => ({
          ...p,
          isOpen: false
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expand"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-expanded"], () => {
        setState((p) => ({
          ...p,
          isOpen: true
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-conversations"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-default-device-changed"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-detach"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-detached"]),



      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-main-presence"], onMainPresence),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-parking-update"], () => {
        if (hasPermission(PERMISSION.PARKINGS)) {
          NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate)
        }
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-queue-member-update"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-queue-update"], onQueueUpdate),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-close"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-recording-closed"], () => {
        setState((p) => ({
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
        setState((p) => ({
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
        setState((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['server-disconnected']: false
          }
        }))
      }),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-connected"], () => {
        setState((p) => ({
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
        setTimeout(() => {
          if (account) {
            setConnected(false)
          }
        }, 1000)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-close"], () => {
        setState((p) => ({
          ...p,
          activeAlerts: {},
        }))
        setConnected(true)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-disconnected-popup-open"], () => {
        setState((p) => ({
          ...p,
          activeAlerts: {
            ...p.activeAlerts,
            ['socket-disconnected']: true
          }
        }))
        setConnected(false)
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-socket-reconnected"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-change"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-theme-changed"]),

      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-user-already-login"], () => {
        window.api.logout()
      }),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-webrtc-registered"]),
      ...eventHandler(PHONE_ISLAND_EVENTS["phone-island-all-alerts-removed"], () => {
        setState((p) => ({
          ...p,
          activeAlerts: {},
          currentCall: {
            ...defaultCall
          }
        }))
      }),



    }
  }
}
