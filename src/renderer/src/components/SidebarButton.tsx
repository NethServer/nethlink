import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import classNames from 'classnames'

export interface SidebarButtonProps {
  icon: IconDefinition
  focus?: boolean
  invert?: boolean
  notificable?: boolean
  isSelected?: boolean
  className?: string
  hasNotification?: boolean
  hasPulseNotification?: boolean
  onClick?: () => void
}
export function SidebarButton({
  icon,
  focus,
  className,
  isSelected,
  notificable,
  hasNotification,
  hasPulseNotification,
  onClick
}: SidebarButtonProps): JSX.Element {
  return (
    <div className='group'>
      <div
        className={classNames(`
      relative w-[32px] h-[32px]
      rounded-lg flex flex-row
      justify-center items-center
      cursor-pointer`,
          focus ? 'dark:bg-hoverDark bg-hoverLight dark:text-titleDark text-titleLight'
            : 'bg-transparent dark:text-gray-400 text-gray-600',
          isSelected ? ''
            : 'dark:hover:bg-hoverDark hover:bg-hoverLight'
          , className
        )}
        onClick={onClick}
      >
        {focus && (
          <div
            className={`${focus ? 'visible' : 'opacity-0'} absolute top-1/2 right-0 -translate-y-1/2 min-w-[3px] min-h-[20px] dark:bg-textBlueDark bg-textBlueLight rounded-l-[4px]`}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <FontAwesomeIcon size="1x" icon={icon} className="text-[20px]" />
        </div>
        {hasNotification && (
          <div className='absolute top-[1px] left-[1px] flex justify-center items-center'>
            <div className={classNames(`
              w-3 h-3
              dark:bg-textRedDark bg-textRedLight

              rounded-full
              border-2 `,
              focus
                ? 'dark:border-hoverDark border-hoverLight'
                : 'dark:border-bgDark border-bgLight dark:group-hover:border-hoverDark group-hover:border-hoverLight'
            )}>

            </div>
            {!focus && hasPulseNotification &&
              <div
                className={classNames(`
                  absolute
                  w-2.5 h-2.5
                  dark:bg-textRedDark bg-textRedLight
                  rounded-full
                  animate-ping
                `)}
              />}
          </div>
        )}
      </div>
    </div>
  )
}
