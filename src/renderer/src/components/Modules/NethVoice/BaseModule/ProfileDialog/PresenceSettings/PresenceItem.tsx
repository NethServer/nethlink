import { StatusTypes } from '@shared/types'
import {
  IconDefinition,
  faCheck as ChooseThemeMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { StatusDot } from '@renderer/components/Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAccount } from '@renderer/hooks/useAccount'
import classNames from 'classnames'
import { Line } from '../Line'
import { menuRowClassName } from '../MenuAction'
export interface PresenceItemProps {
  presenceName: string
  presenceDescription: string
  status: StatusTypes
  icon?: IconDefinition
  hasTopBar?: boolean
  onClick: (status: StatusTypes) => void
}

export function PresenceItem({
  presenceName,
  presenceDescription,
  status,
  hasTopBar,
  icon,
  onClick,
}: PresenceItemProps) {
  const { status: currentStatus } = useAccount()
  const isSelected = currentStatus === status

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(status)
  }

  return (
    <>
      {hasTopBar ? <Line /> : null}
      <button
        type='button'
        aria-pressed={isSelected}
        className={classNames(menuRowClassName)}
        onClick={handleClick}
      >
        <span className='flex w-full flex-col gap-0.5'>
          <span className='flex items-center gap-3'>
            <StatusDot status={status} />
            <span className='flex items-center gap-2'>
              {presenceName}
              {icon && (
                <FontAwesomeIcon
                  icon={icon}
                  className='size-4'
                  aria-hidden='true'
                />
              )}
            </span>
          </span>
          <span className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
            {presenceDescription}
          </span>
        </span>
        {isSelected && (
          <FontAwesomeIcon
            className='size-4 shrink-0'
            icon={ChooseThemeMenuIcon}
            aria-hidden='true'
          />
        )}
      </button>
    </>
  )
}
