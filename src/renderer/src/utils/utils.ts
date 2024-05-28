import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PropsWithChildren } from 'react'
import { log } from '@shared/utils/logger'
import { NotificationConstructorOptions } from 'electron'


export function sendNotification(title: string, body: string, openUrl?: string) {
  const notificationoption: NotificationConstructorOptions = {
    title,
    body,
    silent: false,
    urgency: 'normal'
  }
  window.api.sendNotification(notificationoption, openUrl)
}

export const ClassNames = (...args: ClassValue[]) => {
  return twMerge(clsx(...args))
}

export interface ClearProps {
  key: string
  source: Record<string, unknown>
}

const clean = ({ key, source }: ClearProps): object => {
  delete source[key]
  return source
}

export const cleanClassName = (props: PropsWithChildren<object>): object => {
  return clean({
    key: 'className',
    source: props
  })
}

export function truncate(str: string, maxLength: number) {
  return str.length > maxLength ? str.substring(0, maxLength - 1) + '...' : str
}

export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Checks if the input string contains only valid characters for a phone number.
 */
export function validatePhoneNumber(phoneNumber: any) {
  const regex = /^[0-9*#+]*$/
  return regex.test(phoneNumber)
}