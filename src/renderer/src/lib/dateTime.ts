// Copyright (C) 2024 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { differenceInHours } from 'date-fns'
import { enGB, it } from 'date-fns/locale'
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { getNumericTimezone, getTimezone } from './utils'
import { Account } from '@shared/types'

export const formatInTimeZoneLoc = (date: any, fmt: string, tz: any) => {
  return format(utcToZonedTime(date, tz), fmt, {
    timeZone: tz,
    locale: getLocale(),
  })
}

export function formatDateLocIsAnnouncement(date: any) {
  const dateParts = date?.date_creation.split('/')
  const year = parseInt(dateParts[2], 10)
  const month = parseInt(dateParts[1], 10) - 1
  const day = parseInt(dateParts[0], 10)

  const formattedDate = new Date(year, month, day)

  return format(formattedDate, 'PP', { locale: getLocale() })
}

export const getCallTimeToDisplayIsAnnouncement = (
  date: any,
  differenceInHours: any,
) => {
  const timeParts = date?.time_creation.split(':')
  const hour = parseInt(timeParts[0], 10)
  const minute = parseInt(timeParts[1], 10)
  const second = parseInt(timeParts[2], 10)

  const formattedTime = new Date(Date.UTC(0, 0, 0, hour, minute, second))

  return formatInTimeZoneLoc(formattedTime, 'HH:mm', differenceInHours)
}

/**
 * Get browser locale (english fallback)
 */
export const getLocale = () => {
  let loc = enGB

  if (navigator) {
    const lang = navigator.language.substring(0, 2)
    switch (lang) {
      case 'it':
        loc = it
        break
    }
  }
  return loc
}

export const getTimeDifference = (account: Account, isInQueue: boolean) => {
  let serverTimeZone: any = getTimezone(account)
  const numericTimezone: any = getNumericTimezone(account)
  const numericTimezoneNumber = parseInt(numericTimezone) / 100

  if (serverTimeZone !== '' && serverTimeZone === 'CEST') {
    serverTimeZone = 'Europe/Rome'
  }
  const localTimeZone: any = Intl.DateTimeFormat().resolvedOptions().timeZone

  const timeDataServer = { date: new Date(), timezone: serverTimeZone }
  const timeDataLocal = { date: new Date(), timezone: localTimeZone }

  const t2 = zonedTimeToUtc(timeDataServer.date, timeDataServer.timezone)
  const t1 = zonedTimeToUtc(timeDataLocal.date, timeDataLocal.timezone)

  let differenceValueBetweenTimezone = differenceInHours(t2, t1)

  if (isInQueue) {
    differenceValueBetweenTimezone += numericTimezoneNumber
  }

  return differenceValueBetweenTimezone
}

// Short distances, as in the last calls: "15h ago", "2 mesi fa".
const SHORT_UNITS: Record<string, (count: number) => Record<string, string>> = {
  it: (count) => ({
    xSeconds: 's',
    xMinutes: 'm',
    xHours: 'h',
    xDays: 'g',
    xMonths: count === 1 ? ' mese' : ' mesi',
    xYears: count === 1 ? ' anno' : ' anni',
  }),
  en: () => ({
    xSeconds: 's',
    xMinutes: 'm',
    xHours: 'h',
    xDays: 'd',
    xMonths: 'mo',
    xYears: 'y',
  }),
}

/** A date-fns locale for formatDistanceToNowStrict with the short units above. */
export const shortLocale = (language: string) => {
  const itLang = language === 'it'
  return {
    ...(itLang ? it : enGB),
    formatDistance: (token: string, count: number, options?: any) => {
      const unit = SHORT_UNITS[itLang ? 'it' : 'en'](count)[token] || ''
      const future = options?.comparison && options.comparison > 0
      const suffix = options?.addSuffix
        ? itLang
          ? future
            ? ' tra'
            : ' fa'
          : future
            ? ' in'
            : ' ago'
        : ''
      return `${count}${unit}${suffix}`
    },
  }
}
