export interface AvatarButtonProps {
  className?: string
  showSignOutModal?: () => void
}

export function AvatarButton({ className, showSignOutModal }: AvatarButtonProps): JSX.Element {
  return (
    <div
      className={`inline-block h-6 w-6 rounded-full bg-white ${className}`}
      onClick={showSignOutModal}
    ></div>
  )
}
