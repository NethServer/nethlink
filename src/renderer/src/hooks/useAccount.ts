import { Account, OperatorData, StatusTypes } from "@shared/types"
import { useSubscriber } from "./useSubscriber"
import { useEffect, useState } from "react"
import { log } from "@shared/utils/logger"

export const useAccount = () => {
  const account = useSubscriber<Account>('user')
  const operators = useSubscriber<OperatorData>('operators')

  const [status, setStatus] = useState<StatusTypes>('offline')
  const [isCallsEnabled, setIsCallsEnabled] = useState<boolean>(false)

  useEffect(() => {
    const _status: StatusTypes = operators?.operators?.[account.username]?.mainPresence || account.data?.mainPresence || status
    log('STATUS', _status, account, operators)
    setStatus(() => _status)
    setIsCallsEnabled(() => !(_status === 'busy' || _status === 'ringing' || _status === 'dnd' || _status === 'offline'))

  }, [account, operators])


  return {
    status,
    isCallsEnabled
  }

}
