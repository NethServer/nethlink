import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { usePhoneIslandEventHandler } from "@renderer/hooks/usePhoneIslandEventHandler"
import { useSharedState } from "@renderer/store"
import { StatusTypes } from "@shared/types"
import { Log } from "@shared/utils/logger"

export const usePresenceService = () => {
  const { saveOperators } = usePhoneIslandEventHandler()
  const [account, setAccount] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  async function onSelectPresence(status: StatusTypes, to: string | undefined = undefined) {
    try {
      await NethVoiceAPI.User.setPresence(status, to)
      const me = await NethVoiceAPI.User.me()
      if (to) {
        NethVoiceAPI.fetchOperators().then(saveOperators)
      }
      setAccount({
        ...account!,
        data: {
          ...account!.data!,
          ...me
        }
      })
    } catch (e) {
      Log.error('ON PRESENCE CHANGE', e)
    } finally {
    }
  }

  return {
    onSelectPresence
  }
}
