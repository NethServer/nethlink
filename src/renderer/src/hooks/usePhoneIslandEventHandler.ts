import { useStoreState } from "@renderer/store"
import { Account, CallData, ContactType, HistoryCallData, OperatorData, OperatorsType, ParkingType, ParkingsType, QueuesType } from "@shared/types"
import { log } from "@shared/utils/logger"
import { useAccount } from "./useAccount"
import { validatePhoneNumber } from "@renderer/utils"
import { useCallback, useMemo } from "react"
import { IPC_EVENTS } from "@shared/constants"
import { useRefState } from "./useRefState"

export const usePhoneIslandEventHandler = () => {

  const [account, setAccount] = useRefState<Account>(useStoreState<Account>('account'))
  const [operators, setOperators] = useRefState<OperatorData | undefined>(useStoreState<OperatorData | undefined>('operators'))
  const [speeddials, setSpeeddials] = useRefState<ContactType[]>(useStoreState<ContactType[]>('speeddials'))
  const [queues, setQueues] = useRefState<ContactType[]>(useStoreState<ContactType[]>('queues'))
  const [parkings, setParkings] = useRefState<ParkingType[]>(useStoreState<ParkingType[]>('parkings'))
  const [lastCalls, setLastCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('lastCalls'))
  const { isCallsEnabled } = useAccount()

  function callNumber(number: string) {
    const numberCleanerRegex = /\s+/g
    const cleanNumber = (`${number}`).replace(numberCleanerRegex, '')
    if (number && validatePhoneNumber(cleanNumber) && isCallsEnabled)
      window.electron.send(IPC_EVENTS.EMIT_START_CALL, cleanNumber)
    else
      log('unable to call', number)
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
      updatedOperators.operators[username] = {
        ...(updatedOperators.operators[username] || operator),
        ...operator
      }
      if (account.current && username === account.current.username) {
        account.current.data!.mainPresence = operator.mainPresence
        setAccount(() => account.current)
      }
    }
    setOperators(() => updatedOperators)
  }, [account.current, operators.current])

  function onQueueUpdate(queues: { [queueId: string]: any }) {
    setQueues((p) => ({
      ...p,
      ...queues
    }))
  }

  function onParkingsUpdate(parkings: ParkingsType) {
    const parkedCalls: ParkingType[] = Object.values(parkings)
    setParkings(() => parkedCalls || [])
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

  return {
    saveOperators,
    saveSpeeddials,
    onQueueUpdate,
    onParkingsUpdate,
    onMainPresence,
    saveLastCalls,
    callNumber
  }
}
