import { ReactNode } from "react"

type NumberCallerProps = {
  number: number | string,
  children: JSX.Element | JSX.Element[] | ReactNode | ReactNode[],
  className?: string
}
export const NumberCaller = ({ number, children, ...args }: NumberCallerProps) => {
  return (
    <a href={`callto://${('' + number).replace(/ /g, '')}`} {...args} > {children}</a >
  )
}
