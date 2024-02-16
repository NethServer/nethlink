// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AvatarImageProps {
  className: string
}

// eslint-disable-next-line no-empty-pattern
export function AvatarImage({ className }: AvatarImageProps) {
  return <div className={`${className} rounded-full ring-2 ring-white`}></div>
}
