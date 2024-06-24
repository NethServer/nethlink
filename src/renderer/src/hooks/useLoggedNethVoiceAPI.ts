import { useStoreState } from "@renderer/store"
import { Account } from "@shared/types"
import { useNethVoiceAPI } from "@shared/useNethVoiceAPI"

export const useLoggedNethVoiceAPI = () => {
  const [account] = useStoreState<Account>('account')
  const nethVoiceAPIHook = useNethVoiceAPI(account)
  return nethVoiceAPIHook
}
