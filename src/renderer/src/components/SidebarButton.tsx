import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export interface SidebarButtonProps {
  icon: IconDefinition
  focus?: boolean
  invert?: boolean
  notificable?: boolean
  className?: string
  hasNotification?: boolean
  onClick?: () => void
}
export function SidebarButton({
  icon,
  focus,
  className,
  notificable,
  hasNotification,
  onClick
}: SidebarButtonProps): JSX.Element {
  return (
    <div
      className={`relative w-[32px] h-[32px] rounded-lg flex flex-row justify-center items-center cursor-pointer ${focus ? 'dark:bg-hoverDark bg-hoverLight dark:text-titleDark text-titleLight' : 'bg-transparent dark:text-gray-400 text-gray-600'} ${className}`}
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
        <div
          className={`absolute top-[1px] left-[1px] w-3 h-3 dark:bg-textBlueDark bg-textBlueLight rounded-full border-2 ${focus ? 'dark:border-gray-700 border-gray-100' : 'dark:border-gray-900 border-gray-50'}`}
        />
      )}
    </div>
  )
}
