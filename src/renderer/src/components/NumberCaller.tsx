import { ClassNames } from '@renderer/utils'
import { ReactNode } from 'react'
import { Button } from './Nethesis'

type NumberCallerProps = {
  number: number | string
  children: JSX.Element | JSX.Element[] | ReactNode | ReactNode[],
  disabled: boolean
  className?: string
}
export const NumberCaller = ({ number, children, disabled, className, ...args }: NumberCallerProps) => {
  return (
    disabled ?
      <div className={ClassNames(
        className,
        'cursor-not-allowed',
      )}>{children}</div>
      :
      <a href={`callto://${('' + number).replace(/ /g, '')}`}
        className={ClassNames(
          className,
        )}
        {...args}>
        {children}
      </a>
  )
}
