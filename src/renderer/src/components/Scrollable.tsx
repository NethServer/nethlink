import classNames from 'classnames'

export const Scrollable = ({
  children,
  className,
  innerClassName
}: {
  children?: JSX.Element | JSX.Element[]
  className?: string
  innerClassName?: string
}) => {
  return (
    <div className={classNames('overflow-y-auto mr-[6px] max-h-[calc(100vh-146px)]', className)}>
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
