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
