import { FC, useEffect, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { format, utcToZonedTime } from 'date-fns-tz'
import { enGB, it } from 'date-fns/locale'
import {
  formatDateLocIsAnnouncement,
  getCallTimeToDisplayIsAnnouncement,
  getTimeDifference,
} from '../../lib/dateTime'
import i18next from 'i18next'
import { UTCDate } from '@date-fns/utc'
import { Account } from '@shared/types'
import { useSharedState } from '@renderer/store'

interface CallsDateProps {
  call: any
  spaced?: boolean
  isInQueue?: boolean
  isInAnnouncement?: boolean
  inline?: boolean
}

export const CallsDate: FC<CallsDateProps> = ({
  call,
  spaced,
  isInQueue,
  isInAnnouncement,
  inline,
}) => {
  const [account] = useSharedState('account')

  const [selectedLanguage, setSelectedLanguage] = useState('')

  // trasform the diff value to the format +hhmm or -hhmm
  const diffValueConversation = (diffValueOriginal: any) => {
    // determine the sign
    const sign = diffValueOriginal >= 0 ? '+' : '-'

    // convert hours to string and pad with leading zeros if necessary
    const hours = Math.abs(diffValueOriginal).toString().padStart(2, '0')

    // minutes are always '00'
    const minutes = '00'
    return `${sign}${hours}${minutes}`
  }

  // get the local timezone offset in the format +hhmm or -hhmm
  // get the difference between the local timezone and the timezone of the server
  const getDifferenceBetweenTimezone = (account, isInQueue: boolean) => {
    let differenceValueBetweenTimezone: any
    if (isInQueue) {
      differenceValueBetweenTimezone = getTimeDifference(account, true)
    } else {
      differenceValueBetweenTimezone = getTimeDifference(account, false)
    }

    let diffValueEditedFormat = diffValueConversation(
      differenceValueBetweenTimezone,
    )
    return diffValueEditedFormat
  }

  const getHeaderText = (account, call: any, isInAnnouncement: boolean) => {
    const differenceBetweenTimezone = getDifferenceBetweenTimezone(
      account,
      isInQueue ? true : false,
    )
    const currentLanguage =
      selectedLanguage || i18next?.languages[0] || 'en'

    const shortIt = {
      ...it,
      formatDistance: (token: string, count: number, options?: any) => {
        const map: Record<string, string> = {
          xSeconds: 's',
          xMinutes: 'm',
          xHours: 'h',
          xDays: 'g',
          xMonths: 'mes',
          xYears: 'a',
        }

        const unit = map[token] || ''
        const suffix = options?.addSuffix
          ? options.comparison && options.comparison > 0
            ? ' tra'
            : ' fa'
          : ''

        return `${count}${unit}${suffix}`
      },
    }

    const shortEn = {
      ...enGB,
      formatDistance: (token: string, count: number, options?: any) => {
        const map: Record<string, string> = {
          xSeconds: 's',
          xMinutes: 'm',
          xHours: 'h',
          xDays: 'd',
          xMonths: 'mo',
          xYears: 'y',
        }

        const unit = map[token] || ''
        const suffix = options?.addSuffix
          ? options.comparison && options.comparison > 0
            ? ' in'
            : ' ago'
          : ''

        return `${count}${unit}${suffix}`
      },
    }

    const locale = currentLanguage === 'it' ? shortIt : shortEn

    if (isInAnnouncement) {
      const dateParts = call?.date_creation.split('/')
      const timeParts = call?.time_creation.split(':')

      if (dateParts.length !== 3 || timeParts.length !== 3) {
        return 'Invalid date or time format'
      }

      const day = parseInt(dateParts[0], 10)
      const month = parseInt(dateParts[1], 10) - 1
      const year = parseInt(dateParts[2], 10)
      const hour = parseInt(timeParts[0], 10)
      const minute = parseInt(timeParts[1], 10)
      const second = parseInt(timeParts[2], 10)

      const utcDate = new UTCDate(year, month, day, hour, minute, second)
      const callDate = utcToZonedTime(utcDate, differenceBetweenTimezone)

      return formatDistanceToNowStrict(callDate, {
        addSuffix: true,
        locale,
      })
    } else {
      const callDate = utcToZonedTime(call?.time * 1000, differenceBetweenTimezone)

      return formatDistanceToNowStrict(callDate, {
        addSuffix: true,
        locale,
      })
    }
  }

  const getBodyText = (
    account: Account,
    call: any,
    isInAnnouncement: boolean,
  ) => {
    let differenceBetweenTimezone = ''
    if (isInQueue) {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(account, true)
    } else {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(account, false)
    }
    const currentLanguage = selectedLanguage || i18next?.languages[0] || 'en'
    const locale = currentLanguage === 'it' ? it : enGB

    if (isInAnnouncement) {
      return `(${formatDateLocIsAnnouncement(call)} ${getCallTimeToDisplayIsAnnouncement(
        call,
        differenceBetweenTimezone,
      )})`
    } else {
      return `(${format(
        utcToZonedTime(call?.time * 1000, differenceBetweenTimezone),
        'd MMM yyyy HH:mm',
        { locale },
      )})`
    }
  }

  // check browser language and set the selected language
  useEffect(() => {
    if (i18next?.languages[0] !== '') {
      setSelectedLanguage(i18next?.languages[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18next?.languages[0]])

  if (!account) return <></>

  const headerText = getHeaderText(
    account,
    call,
    isInAnnouncement ? true : false,
  )
  const bodyText = getBodyText(account, call, isInAnnouncement ? true : false)

  return (
    <>
      {inline ? (
        <div className='text-gray-600 dark:text-gray-100 font-normal text-[14px] leading-5'>
          {headerText} {bodyText}
        </div>
      ) : (
        <div
          className={`flex flex-col justify-center flex-shrink-0 ${spaced ? 'gap-1.5' : ''}`}
        >
          <div className='text-gray-600 dark:text-gray-100 font-normal text-[14px] leading-5'>
            {headerText}
          </div>
          <div className='text-gray-600 dark:text-gray-100 font-normal text-[14px] leading-5'>
            {bodyText}
          </div>
        </div>
      )}
    </>
  )
}
