import { useEffect, useRef, useState } from 'react'
import { IPC_EVENTS } from '@shared/constants'
import { useSharedState } from '@renderer/store'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faSearch, faXmark } from '@fortawesome/free-solid-svg-icons'
import classNames from 'classnames'
import { parseThemeToClassName } from '@renderer/utils'
import { TextInput } from '@renderer/components/Nethesis'

export function CommandBarPage() {
  const { t } = useTranslation()
  const [theme] = useSharedState('theme')
  const [phoneNumber, setPhoneNumber] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.electron.receive(IPC_EVENTS.SHOW_COMMAND_BAR, () => {
      setPhoneNumber('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electron.send(IPC_EVENTS.HIDE_COMMAND_BAR)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleCall = () => {
    const trimmedNumber = phoneNumber.trim()
    if (trimmedNumber) {
      const prefixMatch = trimmedNumber.match(/^[*#+]+/)
      const prefix = prefixMatch ? prefixMatch[0] : ''
      const sanitized = trimmedNumber.replace(/[^\d]/g, '')
      const number = prefix + sanitized

      const isValidNumber = /^([*#+]?)(\d{2,})$/.test(number)
      if (isValidNumber) {
        window.electron.send(IPC_EVENTS.EMIT_START_CALL, number)
        window.electron.send(IPC_EVENTS.HIDE_COMMAND_BAR)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCall()
    }
  }

  const handleClear = () => {
    setPhoneNumber('')
    inputRef.current?.focus()
  }

  const themeClass = parseThemeToClassName(theme)

  return (
    <div className={classNames(themeClass, 'font-Poppins')}>
      <div
        className={classNames(
          'h-[80px] w-[500px] rounded-xl overflow-hidden',
          'bg-bgLight dark:bg-bgDark',
          'border border-gray-200 dark:border-gray-700',
          'shadow-2xl',
          'flex items-center px-4 gap-3'
        )}
      >
        <TextInput
          ref={inputRef}
          rounded="base"
          icon={faSearch}
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t('CommandBar.Placeholder') || ''}
          className="flex-1 dark:text-titleDark text-titleLight [&_input]:focus:ring-0 [&_input]:focus:border-gray-300 dark:[&_input]:focus:border-gray-600"
          autoFocus
        />

        {phoneNumber && (
          <button
            onClick={handleClear}
            className={classNames(
              'p-2 rounded-full transition-colors',
              'text-gray-400 hover:text-gray-600',
              'dark:text-gray-500 dark:hover:text-gray-300'
            )}
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={handleCall}
          disabled={!phoneNumber.trim()}
          className={classNames(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            'flex items-center gap-2',
            phoneNumber.trim()
              ? 'bg-primary text-white hover:bg-primaryDark'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          )}
        >
          <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
          <span>{t('CommandBar.Call')}</span>
        </button>
      </div>
    </div>
  )
}
