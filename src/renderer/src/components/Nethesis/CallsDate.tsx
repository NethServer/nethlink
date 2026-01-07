import { FC, useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { format } from 'date-fns-tz'
import { utcToZonedTime } from 'date-fns-tz'
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
  const getLocalTimezoneOffset = () => {
    let localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()
    const offset = format(now, 'xx', { timeZone: localTimezone })
    return offset
  }

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

  const formatCompactDistance = (totalSeconds: number) => {
    const safeSeconds = Number.isFinite(totalSeconds)
      ? Math.max(0, Math.floor(totalSeconds))
      : 0

    const days = Math.floor(safeSeconds / 86400)
    const hours = Math.floor((safeSeconds % 86400) / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    const seconds = safeSeconds % 60

    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  }

  const getHeaderText = (account, call: any, isInAnnouncement: boolean) => {
    let localTimeZone = getLocalTimezoneOffset()
    let differenceBetweenTimezone = ''
    if (isInQueue) {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(account, true)
    } else {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(account, false)
    }
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

      const eventDate = utcToZonedTime(utcDate, differenceBetweenTimezone)
      const nowDate = utcToZonedTime(new Date(), localTimeZone)
      const diffSeconds = differenceInSeconds(nowDate, eventDate)
      const compact = formatCompactDistance(Math.abs(diffSeconds))

      return diffSeconds >= 0
        ? i18next.t('Common.time_distance_ago', { timeDistance: compact })
        : `in ${compact}`
    } else {
      const eventDate = utcToZonedTime(
        call?.time * 1000,
        differenceBetweenTimezone,
      )
      const nowDate = utcToZonedTime(new Date(), localTimeZone)
      const diffSeconds = differenceInSeconds(nowDate, eventDate)
      const compact = formatCompactDistance(Math.abs(diffSeconds))

      return diffSeconds >= 0
        ? i18next.t('Common.time_distance_ago', { timeDistance: compact })
        : `in ${compact}`
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

    if (isInAnnouncement) {
      return `(${formatDateLocIsAnnouncement(call)} ${getCallTimeToDisplayIsAnnouncement(
        call,
        differenceBetweenTimezone,
      )})`
    } else {
      return `(${format(
        utcToZonedTime(call?.time * 1000, differenceBetweenTimezone),
        'd MMM yyyy HH:mm',
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
