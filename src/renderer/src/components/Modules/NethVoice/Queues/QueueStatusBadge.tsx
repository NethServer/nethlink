import classNames from 'classnames'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { QueueMemberStatus } from './hook/useQueuesModule'
import { getPauseReasonIcon, getPauseReasonText } from './QueuePauseMenu'

// colors of the Surface/Badge and Text/Badge tokens of the design system
const STATUS_CLASSES: Record<QueueMemberStatus, string> = {
  loggedIn: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-50',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-50',
  loggedOut: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
}

const STATUS_LABELS: Record<QueueMemberStatus, string> = {
  loggedIn: 'Queues.Logged in',
  paused: 'Queues.On a break',
  loggedOut: 'Queues.Logged out',
}

export interface QueueStatusBadgeProps {
  status: QueueMemberStatus
  // the reason of a pause, for its icon
  pauseReason?: string
  className?: string
}

export const QueueStatusBadge = ({
  status,
  pauseReason,
  className,
}: QueueStatusBadgeProps) => {
  return (
    <span
      className={classNames(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium leading-4',
        STATUS_CLASSES[status],
        className,
      )}
    >
      {status === 'paused' && (
        <FontAwesomeIcon
          icon={getPauseReasonIcon(pauseReason)}
          className='size-3'
          aria-hidden='true'
        />
      )}
      {t(STATUS_LABELS[status])}
      {/* the reason is shown by the icon only: screen readers read it */}
      {status === 'paused' && getPauseReasonText(pauseReason) && (
        <span className='sr-only'>: {getPauseReasonText(pauseReason)}</span>
      )}
    </span>
  )
}
