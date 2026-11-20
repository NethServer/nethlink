import classNames from 'classnames'

// the scrolling area under a module title (h-10)
export const Scrollable = ({
  children,
  className,
  innerClassName,
}: {
  children?: React.ReactNode
  className?: string
  innerClassName?: string
}) => {
  return (
    <div
      className={classNames(
        'relative h-[calc(100%-2.5rem)] overflow-y-auto',
        className,
      )}
    >
      <div className={classNames('relative', innerClassName)}>{children}</div>
    </div>
  )
}
