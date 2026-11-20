import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from './Nethesis'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { DefaultTFuncReturn } from 'i18next'
import { ReactNode, useId } from 'react'
import { ClassNames } from '@renderer/utils'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'
import { CustomThemedTooltip } from './Nethesis/CustomThemedTooltip'

export interface ModuleTitleProps {
  title?: string | DefaultTFuncReturn | ReactNode
  action?: () => void
  actionText?: string | DefaultTFuncReturn
  actionIcon?: IconProp
  actionComponent?: ReactNode
  className?: string
}
export const ModuleTitle = ({
  title,
  action,
  actionText,
  actionIcon,
  actionComponent,
  className,
}: ModuleTitleProps) => {
  const tooltipId = useId()
  const [titleRef, isTitleTruncated] = useIsTruncated<HTMLHeadingElement>([
    title,
  ])
  const showTitleTooltip = typeof title === 'string' && isTitleTruncated

  return (
    <div className='px-4'>
      <div
        className={ClassNames(
          'flex h-10 items-center justify-between gap-3 border-b border-borderLight dark:border-borderDark',
          className,
        )}
      >
        {title && (
          <h1
            ref={titleRef}
            className='truncate text-base font-medium leading-6 text-titleLight dark:text-titleDark'
            data-tooltip-id={showTitleTooltip ? tooltipId : undefined}
            data-tooltip-content={showTitleTooltip ? title : undefined}
          >
            {title}
            {showTitleTooltip && (
              <CustomThemedTooltip id={tooltipId} place='bottom' />
            )}
          </h1>
        )}
        {action && (
          <Button
            variant='ghost'
            size='small'
            className='-mr-2.5 shrink-0 gap-2'
            onClick={action}
          >
            {actionIcon && (
              <FontAwesomeIcon
                className='size-4'
                icon={actionIcon}
                aria-hidden='true'
              />
            )}
            {actionText}
          </Button>
        )}
        {actionComponent}
      </div>
    </div>
  )
}
