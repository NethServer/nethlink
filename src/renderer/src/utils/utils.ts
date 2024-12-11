import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PropsWithChildren } from 'react'
import { Log } from '@shared/utils/logger'
import { AvailableThemes } from '@shared/types'

export const parseThemeToClassName = (theme: AvailableThemes | undefined) => {
  return theme === 'system' ? getSystemTheme() : theme || 'dark'
}
export async function sendNotification(title: string, body: string, openUrl?: string) {
  let hasPermission = false
  if (!("Notification" in window)) {
    // Check if the browser supports notifications
    alert("This browser does not support desktop notification");
  } else if (Notification.permission === "granted") {
    hasPermission = true
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    hasPermission = permission === "granted"
  }

  if (hasPermission) {
    const notificationoption: NotificationOptions = {
      body,
      icon: "./icons/Nethlink-logo.svg",
      //image: "./icons/TrayNotificationIcon.svg",
      silent: false,
    }
    const notification = new window.Notification(title, notificationoption);
    notification.onclick = () => {
      openUrl && window.open(openUrl, '_blank')
      Log.info('onclick')
    }
    notification.onerror = (e) => {
      Log.error('NOTIFICATION ERROR:', e)
    }
    notification.onshow = (e) => {
      Log.info('NOTIFICATION SHOWN:', e)
    }
  }
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
