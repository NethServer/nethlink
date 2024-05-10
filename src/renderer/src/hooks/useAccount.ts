import { Account, OperatorData, StatusTypes } from "@shared/types"
import { useSubscriber } from "./useSubscriber"

export const useAccount = () => {
  const account = useSubscriber<Account>('user')
  const operators = useSubscriber<OperatorData>('operators')

  const status: StatusTypes = operators?.operators?.[account.username]?.mainPresence || account.data?.mainPresence || 'offline'

  return {
    status
  }

}
