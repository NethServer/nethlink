import { ClassNames } from '@renderer/utils'
import { ReactNode } from 'react'
type NumberCallerProps = {
  number: number | string
  children: JSX.Element | JSX.Element[] | ReactNode | ReactNode[]
  disabled: boolean
  className?: string
  isNumberHiglighted?: boolean
}
export const NumberCaller = ({
  number,
  children,
  disabled,
  className,
  isNumberHiglighted = true,
  ...args
}: NumberCallerProps) => {

  return disabled ? (
    <div className={ClassNames(className, 'cursor-not-allowed',)}>{children}</div>
  ) : (
    <a
      href={`callto://${('' + number).replace(/ /g, '')}`}
      className={ClassNames(className, 'dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-md')}
      {...args}
    >
      <div
        className={`${isNumberHiglighted ? 'dark:text-titleDark text-titleLight' : ''} font-normal`}
      >
        {children}
      </div>
    </a>
  )
}