import { t } from 'i18next'
import { PresenceItem } from './../PresenceSettings/PresenceItem'
import {
  faArrowRight as CallForwardIcon,
  faMobile as CallForwardMobileIcon,
  faVoicemail as VoiceMailIcon
} from '@fortawesome/free-solid-svg-icons'
import { Log } from '@shared/utils/logger'
import { isEmpty } from 'lodash'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useAccount } from '@renderer/hooks/useAccount'
import { PERMISSION } from '@shared/constants'
import { usePresenceService } from './../PresenceSettings/usePresenceService'

export function SettingsBox() {
  const [, setIsForwardDialogOpen] = useNethlinkData('isForwardDialogOpen')
  const [account] = useSharedState('account')
  const { hasPermission } = useAccount()
  const { onSelectPresence } = usePresenceService()

  return (
    <div>
      {
        <PresenceItem
          onClick={() => setIsForwardDialogOpen(true)}
          status="callforward"
          presenceName={t('TopBar.Call forward')}
          presenceDescription={t('TopBar.Forward incoming calls to another phone number')}
          icon={CallForwardIcon}
        />
      }
    </div>
  )
}
