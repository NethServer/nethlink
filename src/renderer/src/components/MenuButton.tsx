export interface MenuButtonProps {
  focus?: boolean
  invert?: boolean
  notificable?: boolean
  Icon: JSX.Element
  label?: string
  className?: string
  hasNotification?: boolean
  onClick?: () => void
}
export function MenuButton({
  focus,
  invert,
  className,
  notificable,
  hasNotification,
  Icon,
  label,
  onClick
}: MenuButtonProps) {
  function getColor(inv) {
    return inv ? 'white' : focus ? '#374151' : '#111827'
  }

  return (
    <div
      className={`p-1 rounded-lg flex flex-row gap-3 justify-center items-center cursor-pointer ${focus ? 'bg-gray-700' : 'bg-transparent'} ${className}`}
      onClick={onClick}
    >
      {Icon}
      {label && <p>{label}</p>}
      {(notificable || hasNotification) && (
        <div
          className={`${hasNotification ? 'visible' : 'opacity-0'} w-[12px] h-[12px] bg-blue-500 rounded-full`}
        ></div>
      )}
    </div>
  )
}
