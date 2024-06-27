import classNames from 'classnames'

export const Scrollable = ({
  children,
  className
}: {
  children?: JSX.Element | JSX.Element[]
  className?: string
}) => {
  return <div className={classNames('overflow-y-auto mr-[6px]', className)}>{children}</div>
}
