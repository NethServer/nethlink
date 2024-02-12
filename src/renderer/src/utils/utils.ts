import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const ClassNames = (...args: ClassValue[]) => {
  return twMerge(clsx(...args))
}
