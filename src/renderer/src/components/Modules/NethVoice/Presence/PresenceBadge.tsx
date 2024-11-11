import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faMobile, faVoicemail } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@renderer/components/Nethesis/Badge'
import { useStoreState } from '@renderer/store'
import { Account, OperatorData, StatusTypes } from '@shared/types'
import { t } from 'i18next'
import { useTheme } from '@renderer/theme/Context'
import classNames from 'classnames'
import { Tooltip } from 'react-tooltip'
import { log } from '@shared/utils/logger'

export interface PresenceBadgeProps {
  mainPresence: StatusTypes | undefined
  className?: string
}

export const PresenceBadgeVisibility = ['callforward', 'voicemail', 'cellphone']
export const PresenceBadge = ({ mainPresence, className }: PresenceBadgeProps) => {
  const [account] = useStoreState<Account>('account')
  const [operators] = useStoreState<OperatorData>('operators')
  const { badge: theme, status: statuses } = useTheme().theme

  if (PresenceBadgeVisibility.includes(mainPresence as string)) {
    const isCallforward = ['callforward', 'voicemail'].includes(mainPresence as string)
    if (!(account?.data?.mainextension && operators?.extensions[account.data.mainextension])) {
      return (
        <div
          className={classNames(
            'animate-pulse h-5 w-8 bg-gray-300 dark:bg-gray-600 z-[100]',
            theme.base,
            theme.rounded['full'],
            statuses[isCallforward ? 'callforward' : 'voicemail']?.badge.base,
            theme.sizes['small']
          )}
        ></div>
      )
    } else {
      return (
        <div className={classNames('h-5 w-8 z-[100]', className)}>
          <Badge

            variant={isCallforward ? 'callforward' : 'voicemail'}
            rounded="full"
            size="small"
            className={`flex flex-row justify-center px-2.5 py-0.5 h-5 w-full overflow-hidden`}
            data-tooltip-id={`presence_box`}
            data-tooltip-content={
              `${mainPresence === 'callforward'
                ? t('TopBar.Call forward')
                : mainPresence === 'cellphone'
                  ? t('TopBar.Cellphone')
                  : t('TopBar.Voicemail')
              } ${account?.data?.endpoints?.cellphone[0]?.id &&
                mainPresence === 'cellphone' ?
                `${': ' + account?.data?.endpoints?.cellphone[0]?.id}` : ''
              } ${operators?.extensions[account.data.mainextension]?.cf !== '' &&
                mainPresence === 'callforward' ?
                `${': ' + operators?.extensions[account.data.mainextension]?.cf}` : ''
              }`
            }
          >
            <FontAwesomeIcon
              icon={
                mainPresence === 'callforward'
                  ? faArrowRight
                  : mainPresence === 'cellphone'
                    ? faMobile
                    : faVoicemail
              }
              className="h-4 w-4 text-topBarText dark:text-topBarTextDark"
              aria-hidden="true"
            />

            <Tooltip
              id={`presence_box`}
              place="bottom"
              className="z-[100000] font-medium text-xs leading-[18px]"
              opacity={1}
              noArrow={false}

            />
          </Badge>

        </div>
      )
    }
  }
  return <></>
}
