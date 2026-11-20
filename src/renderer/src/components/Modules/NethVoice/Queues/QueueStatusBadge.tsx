import classNames from 'classnames'
import { t } from 'i18next'
import { QueueMemberStatus } from './hook/useQueuesModule'

// colors of the Surface/Badge and Text/Badge tokens of the design system
const STATUS_CLASSES: Record<QueueMemberStatus, string> = {
  signedIn: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-50',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-50',
  signedOut: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100',
}

const STATUS_LABELS: Record<QueueMemberStatus, string> = {
  signedIn: 'Queues.Signed in',
  paused: 'Queues.On a break',
  signedOut: 'Queues.Signed out',
}

export interface QueueStatusBadgeProps {
  status: QueueMemberStatus
  className?: string
}

export const QueueStatusBadge = ({
  status,
  className,
}: QueueStatusBadgeProps) => {
  return (
    <span
      className={classNames(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4',
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t(STATUS_LABELS[status])}
    </span>
  )
}
