import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faMobile, faVoicemail } from "@fortawesome/free-solid-svg-icons"
import { Badge } from "@renderer/components/Nethesis/Badge"
import { useStoreState } from "@renderer/store"
import { Account, OperatorData } from "@shared/types"
import { t } from "i18next"
import { SkeletonRow } from "@renderer/components/SkeletonRow"
import { useTheme } from "@renderer/theme/Context"
import classNames from "classnames"

export const PresenceBadge = ({ presence }) => {

  const [account] = useStoreState<Account>('account')
  const [operators] = useStoreState<OperatorData>('operators')
  const { badge: theme, status: statuses } = useTheme().theme

  if (['callforward', 'voicemail', 'cellphone'].includes(presence)) {
    const isCallforward = ['callforward', 'voicemail'].includes(presence)
    if (!(account?.data?.mainextension && operators?.extensions[account.data.mainextension])) {
      return <div className={classNames(
        'animate-pulse mt-[3px] h-[25px] w-[106px] bg-gray-300 dark:bg-gray-600 z-[100]',
        theme.base,
        theme.rounded['full'],
        statuses[isCallforward ? 'callforward' : 'voicemail']?.badge.base,
        theme.sizes['small']
      )}></div>
    } else {
      return (
        <Badge
          variant={
            isCallforward ? 'callforward' : 'voicemail'
          }
          rounded='full'
          size='small'
          className='z-[100]'
        >
          <FontAwesomeIcon
            icon={
              presence === 'callforward'
                ? faArrowRight
                : presence === 'cellphone'
                  ? faMobile
                  : faVoicemail
            }
            className='h-4 w-4 mr-2 text-topBarText dark:text-topBarTextDark'
            aria-hidden='true'
          />
          <span>
            {presence === 'callforward' ? t('TopBar.Call forward')
              : presence === 'cellphone'
                ? t('TopBar.Cellphone')
                : t('TopBar.Voicemail')}
          </span>
          {account?.data?.endpoints?.cellphone[0]?.id &&
            presence === 'cellphone' &&
            `${': ' + account?.data?.endpoints?.cellphone[0]?.id}`}
          {operators?.extensions[account.data.mainextension]?.cf !== '' &&
            presence === 'callforward' &&
            `${': ' + operators?.extensions[account.data.mainextension]?.cf}`}
        </Badge>
      )
    }
  }
  return (<></>)
}
