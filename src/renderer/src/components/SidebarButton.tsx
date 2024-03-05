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
      className={`relative w-[32px] h-[32px] rounded-lg flex flex-row justify-center items-center cursor-pointer ${focus ? 'dark:bg-gray-700 bg-gray-100' : 'bg-transparent dark:text-gray-700 text-gray-600'} ${className}`}
      onClick={onClick}
    >
      {(notificable || hasNotification) && (
        <div
          className={`${hasNotification ? 'visible' : 'opacity-0'} absolute top-1/2 right-0 -translate-y-1/2 min-w-[3px] min-h-[20px] dark:bg-blue-500 bg-blue-600 rounded-l-[4px]`}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <FontAwesomeIcon size="1x" icon={icon} className="text-[20px]" />
      </div>
    </div>
  )
}
