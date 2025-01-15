import { useNethlinkData, useSharedState } from "@renderer/store"
import { CallData, ContactType, HistoryCallData, OperatorData, ParkingType, ParkingsType } from "@shared/types"
import { Log } from "@shared/utils/logger"
import { useAccount } from "./useAccount"
import { sendNotification, validatePhoneNumber } from "@renderer/utils"
import { useCallback, } from "react"
import { IPC_EVENTS, PERMISSION } from "@shared/constants"
import { getTimeDifference } from "@renderer/lib/dateTime"
import { format, utcToZonedTime } from "date-fns-tz"
import { useLoggedNethVoiceAPI } from "./useLoggedNethVoiceAPI"
import { differenceWith } from "lodash"
import { t } from "i18next"
import { useRefState } from "./useRefState"

export const usePhoneIslandEventHandler = () => {

  const { isCallsEnabled, hasPermission } = useAccount()
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const [account, setAccount] = useRefState(useSharedState('account'))
  const [operators, setOperators] = useRefState(useNethlinkData('operators'))
  const [, setSpeeddials] = useRefState(useNethlinkData('speeddials'))
  const [, setQueues] = useRefState(useNethlinkData('queues'))
  const [, setParkings] = useRefState(useNethlinkData('parkings'))
  const [lastCalls, setLastCalls] = useRefState(useNethlinkData('lastCalls'))
  const [missedCalls, setMissedCalls] = useRefState(useNethlinkData('missedCalls'))


  function callNumber(number: string) {
    const numberCleanerRegex = /\s+/g
    const cleanNumber = (`${number}`).replace(numberCleanerRegex, '')
    if (number && validatePhoneNumber(cleanNumber) && isCallsEnabled)
      window.electron.send(IPC_EVENTS.EMIT_START_CALL, cleanNumber)
    else
      Log.warning('unable to call', number)
  }

  const onMainPresence = useCallback((op: { [username: string]: any }) => {
    // eslint-disable-next-line no-prototype-builtins
    const updatedOperators = {
      operators: operators.current?.operators || {},
      userEndpoints: operators.current?.operators || {},
      //the other data only comes to me from the fetch and so I can take it as valid
      avatars: operators.current?.avatars || {},
      groups: operators.current?.groups || {},
      extensions: operators.current?.extensions || {},
    }
    for (const [username, operator] of Object.entries(op)) {
      if (username !== account.current!.username) {
        if (updatedOperators.operators[username]) {
          updatedOperators.operators[username].mainPresence = operator.mainPresence
        } else {
          updatedOperators.operators[username] = {
            ...operator
          }
        }
      } else {
        setAccount((p) => {
          if (p && p.data) {
            return {
              ...p,
              data: {
                ...p.data,
                mainPresence: operator.mainPresence
              }
            }
          }
          return undefined
        })
      }
    }
    setOperators(() => updatedOperators)
  }, [account.current, operators])

  function onQueueUpdate(queues: { [queueId: string]: any }) {
    setQueues((p) => ({
      ...p,
      ...queues
    }))
  }

  function onParkingsUpdate(parkings: ParkingsType) {
    const parkedCalls: ParkingType[] = Object.values(parkings)
    setParkings(() => [...parkedCalls])
  }

  function saveSpeeddials(speeddialsResponse: ContactType[] | undefined) {
    setSpeeddials(() => speeddialsResponse || [])
  }



  function saveLastCalls(historyResponse: HistoryCallData | undefined) {
    setLastCalls(() => historyResponse?.rows || [])
  }

  function saveOperators(newOperators: OperatorData | undefined) {
    setOperators(() => newOperators)
  }

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
          const differenceBetweenTimezone = diffValueConversation(getTimeDifference(account.current!, false))
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
    setLastCalls(() => [
      ...newLastCalls.rows
    ])
  }

  const updateLastCalls = async () => {
    try {
      const newLastCalls: {
        count: number, rows: CallData[]
      } = await NethVoiceAPI.HistoryCall.interval()
      gestLastCalls(newLastCalls)
    } catch (e) {
      Log.warning('error during NethVoiceAPI.HistoryCall.interval', e)
    }
  }


  const updateParkings = () => {
    if (hasPermission(PERMISSION.PARKINGS)) {
      NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate)
    }
  }
  return {
    saveOperators,
    saveSpeeddials,
    onQueueUpdate,
    onParkingsUpdate,
    onMainPresence,
    saveLastCalls,
    callNumber,
    updateLastCalls,
    updateParkings
  }
}
