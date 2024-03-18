import { FC, useEffect, useState } from 'react'
import { formatDistance } from 'date-fns'
import { format } from 'date-fns-tz'
import { utcToZonedTime } from 'date-fns-tz'
import { enGB, it } from 'date-fns/locale'
import { getTimeDifference } from '../../lib/dateTime'
import i18next from 'i18next'

interface CallsDateProps {
  call: any
  spaced?: boolean
  isInQueue?: boolean
  isInAnnouncement?: boolean
}

export const CallsDate: FC<CallsDateProps> = ({ call, spaced, isInQueue }) => {
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
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()
    const offset = format(now, 'xx', { timeZone: localTimezone })
    return offset
  }

  // get the difference between the local timezone and the timezone of the server
  const getDifferenceBetweenTimezone = (isInQueue: boolean) => {
    let differenceValueBetweenTimezone: any
    if (isInQueue) {
      differenceValueBetweenTimezone = getTimeDifference(true)
    } else {
      differenceValueBetweenTimezone = getTimeDifference(false)
    }

    const diffValueEditedFormat = diffValueConversation(differenceValueBetweenTimezone)
    return diffValueEditedFormat
  }

  const getHeader = (call: any) => {
    const localTimeZone = getLocalTimezoneOffset()
    let differenceBetweenTimezone = ''
    if (isInQueue) {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(true)
    } else {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(false)
    }

    //TODO da vedere bene se la modifica e' giusta
    const distance = formatDistance(
      utcToZonedTime(call?.time * 1000, differenceBetweenTimezone),
      utcToZonedTime(new Date(), localTimeZone),
      {
        addSuffix: false,
        includeSeconds: false,
        locale: selectedLanguage === 'it' ? it : enGB
      }
    ).replace('about ', '')

    const [value, unit] = distance.split(' ')

    const formattedDistance = `${value}${unit[0].toLowerCase()}`

    return (
      <div className="text-sm font-medium text-gray-600 dark:text-gray-100 leading-5">
        {formattedDistance}
      </div>
    )
  }

  const getBody = (call: any) => {
    let differenceBetweenTimezone = ''
    if (isInQueue) {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(true)
    } else {
      differenceBetweenTimezone = getDifferenceBetweenTimezone(false)
    }

    return (
      <div className="text-sm text-gray-600 dark:text-gray-100 font-normal leading-5">
        ({format(utcToZonedTime(call?.time * 1000, differenceBetweenTimezone), 'HH:mm')})
      </div>
    )
  }

  // check browser language and set the selected language
  useEffect(() => {
    if (i18next?.languages[0] !== '') {
      setSelectedLanguage(i18next?.languages[0])
    }
  }, [i18next?.languages[0]])

  return (
    <>
      <div
        className={`flex flex-row gap-2 justify-center flex-shrink-0 ${spaced ? 'gap-1.5' : ''}`}
      >
        {getHeader(call)}
        {getBody(call)}
      </div>
    </>
  )
}
