import { Account, OperatorData, StatusTypes } from "@shared/types"
import { useEffect, useState } from "react"
import { log } from "@shared/utils/logger"
import { useStoreState } from "@renderer/store"

export const useAccount = () => {
  const [account] = useStoreState<Account>('account')

  const [status, setStatus] = useState<StatusTypes>('offline')
  const [isCallsEnabled, setIsCallsEnabled] = useState<boolean>(false)

  useEffect(() => {
    if (account) {

      const _status: StatusTypes = account.data?.mainPresence || status
      setStatus(() => _status)
      setIsCallsEnabled(() => !(_status === 'busy' || _status === 'ringing' || _status === 'offline'))
    } else {
      setStatus('offline')
      setIsCallsEnabled(false)
    }

  }, [account?.data])


  return {
    status,
    isCallsEnabled
  }

}
