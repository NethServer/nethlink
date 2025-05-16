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
  const onClick = () => {
    const url = `callto://${('' + number).replace(/ /g, '')}`
    window.api.openExternalPage(url);
  }

  return disabled ? (
    <div className={ClassNames(className, 'cursor-not-allowed',)}>{children}</div>
  ) : (
    <div
      className={ClassNames(className,
        'dark:text-textBlueDark text-textBlueLight',
        'cursor-pointer dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-md')}
      {...args}
      onClick={onClick}
    >
      <div
        className={`${isNumberHiglighted ? 'dark:text-textBlueDark text-textBlueLight' : ''} font-normal`}
      >
        {children}
      </div>
    </div>
  )
}
