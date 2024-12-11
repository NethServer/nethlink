import classNames from 'classnames'

export const Scrollable = ({
  children,
  className,
  innerClassName
}: {
  children?: React.ReactNode
  className?: string
  innerClassName?: string
}) => {


  return (
    <div className={classNames('relative overflow-y-auto h-[calc(100%-28px)] mr-1.5', className)}>
      <div className={classNames('relative ', innerClassName)}>{children}</div>
    </div>
  )
}
