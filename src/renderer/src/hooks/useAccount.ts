import { Account, OperatorData, StatusTypes } from "@shared/types"
import { useSubscriber } from "./useSubscriber"
import { useEffect, useState } from "react"

export const useAccount = () => {
  const account = useSubscriber<Account>('user')
  const operators = useSubscriber<OperatorData>('operators')

  const [status, setStatus] = useState<StatusTypes>('offline')

  useEffect(() => {
    const _status: StatusTypes = operators?.operators?.[account.username]?.mainPresence || account.data?.mainPresence || 'offline'
    setStatus(() => _status)

  }, [account, operators])


  return {
    status
  }

}
