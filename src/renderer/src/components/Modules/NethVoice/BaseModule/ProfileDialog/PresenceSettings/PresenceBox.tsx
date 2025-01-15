import { t } from 'i18next'
import { PresenceItem } from './PresenceItem'
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
import { usePresenceService } from './usePresenceService'

export function PresenceBox() {
  const [, setIsForwardDialogOpen] = useNethlinkData('isForwardDialogOpen')
  const [account] = useSharedState('account')
  const { hasPermission } = useAccount()
  const { onSelectPresence } = usePresenceService()

  return (
    <div>
      <PresenceItem
        onClick={onSelectPresence}
        status="online"
        presenceName={t('TopBar.Online')}
        presenceDescription={t('TopBar.Make and receive phone calls')}
      />
      {/* check callforward permission */}
      {hasPermission(PERMISSION.CALL_FORWARD) && (
        <PresenceItem
          onClick={() => setIsForwardDialogOpen(true)}
          status="callforward"
          presenceName={t('TopBar.Call forward')}
          presenceDescription={t('TopBar.Forward incoming calls to another phone number')}
          icon={CallForwardIcon}
        />
      )}
      {!isEmpty(account?.data?.endpoints.cellphone) && (
        <PresenceItem
          onClick={() =>
            onSelectPresence('callforward', account!.data!.endpoints.cellphone[0]!.id)
          }
          status="callforward"
          presenceName={t('TopBar.Mobile')}
          presenceDescription={t('TopBar.Do not receive any calls')}
          icon={CallForwardMobileIcon}
        />
      )}
      {!isEmpty(account?.data?.endpoints.voicemail) && (
        <PresenceItem
          onClick={() => onSelectPresence('voicemail')}
          status="voicemail"
          presenceName={t('TopBar.Voicemail')}
          presenceDescription={t('TopBar.Activate voicemail')}
          icon={VoiceMailIcon}
        />
      )}
      {/* check dnd permission */}
      {hasPermission(PERMISSION.DND) && (
        <PresenceItem
          onClick={onSelectPresence}
          status="dnd"
          presenceName={t('TopBar.Do not disturb')}
          presenceDescription={t('TopBar.Do not receive any calls')}
          hasTopBar={true}
        />
      )}
    </div>
  )
}
