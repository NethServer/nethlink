import { useStoreState } from "@renderer/store"
import { Account, CallData, ContactType, HistoryCallData, OperatorData, QueuesType } from "@shared/types"
import { log } from "@shared/utils/logger"
import { useAccount } from "./useAccount"
import { validatePhoneNumber } from "@renderer/utils"
import { useCallback, useMemo } from "react"
import { IPC_EVENTS } from "@shared/constants"

export const usePhoneIslandEventHandler = () => {

  const [account] = useStoreState<Account>('account')
  const [operators, setOperators] = useStoreState<OperatorData>('operators')
  const [speeddials, setSpeeddials] = useStoreState<ContactType[]>('speeddials')
  const [queues, setQueues] = useStoreState<QueuesType>('queues')
  const [lastCalls, setLastCalls] = useStoreState<CallData[]>('lastCalls')
  const { isCallsEnabled } = useAccount()

  function callNumber(number: string) {
    if (number && validatePhoneNumber(number) && isCallsEnabled)
      window.electron.send(IPC_EVENTS.EMIT_START_CALL, number)
    else
      log('unable to call', number)
  }

  const onMainPresence = useCallback((op: { [username: string]: any }) => {
    log('onMainPresence', operators, op)
    // eslint-disable-next-line no-prototype-builtins
    const updatedOperators = {
      operators: operators?.operators || {},
      userEndpoints: operators?.operators || {},
      //the other data only comes to me from the fetch and so I can take it as valid
      avatars: operators?.avatars || {},
      groups: operators?.groups || {},
      extensions: operators?.extensions || {},
    }
    for (const [username, operator] of Object.entries(op)) {
      updatedOperators.operators[username] = {
        ...(updatedOperators.operators[username] || operator),
        ...operator
      }
      if (account && username === account.username) {
        account.data!.mainPresence = operator.mainPresence
      }
    }
    setOperators(() => updatedOperators)
  }, [account, operators])

  function onQueueUpdate(queues: { [queueId: string]: any }) {
    setQueues((p) => ({
      ...p,
      ...queues
    }))
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
    onMainPresence,
    saveLastCalls,
    callNumber
  }
}
