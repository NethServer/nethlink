import { StatusTypes } from "@shared/types"
import { useEffect, useState } from "react"
import { useSharedState } from "@renderer/store"
import { PERMISSION } from "@shared/constants"



export const useAccount = () => {
  const [account] = useSharedState('account')

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

  const hasPermission = (permission: PERMISSION) => {
    return account?.data?.profile?.macro_permissions?.settings?.permissions?.[permission]?.value
  }

  return {
    status,
    isCallsEnabled,
    hasPermission
  }

}
