import classNames from "classnames"
interface BackdropProps {
  onBackdropClick: () => void,
  className?: string
}
export function Backdrop({ onBackdropClick, className }: BackdropProps) {
  return (
    <div
      className={classNames(`absolute w-[100vw] h-[100vh] rounded-b-lg top-0 left-0`, className)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onBackdropClick()
      }}
    ></div>
  )
}
