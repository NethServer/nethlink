import { useEffect, useRef } from 'react'
import { t } from 'i18next'
import { Account, isSsoMethod } from '@shared/types'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { sendSystemNotification } from '@renderer/utils'
import {
  getPasswordDaysLeft,
  getPasswordExpiringTitle,
  PASSWORD_EXPIRATION_WARNING_DAYS,
} from '@renderer/lib/password'

// the middleware reads the info in background after the login
const RETRY_DELAY = 5000
const MAX_ATTEMPTS = 4
const CHECK_INTERVAL = 1000 * 60 * 60

/**
 * Warn the user, once a day, when the password is expired or about to expire
 */
export const usePasswordExpirationWarning = (account: Account | undefined) => {
  const { NethVoiceAPI } = useNethVoiceAPI(account)
  // the account token changes on re-login: always call with the latest one
  const apiRef = useRef(NethVoiceAPI)
  apiRef.current = NethVoiceAPI

  useEffect(() => {
    if (!account?.username || isSsoMethod(account.authenticationMethod)) {
      return
    }

    const storageKey = `password-expiration-warning-${account.username}@${account.host}`
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    // set on cleanup: a pending check must not act for a previous account
    let cancelled = false

    const check = async () => {
      attempts++
      let info
      try {
        info = await apiRef.current.User.passwordInfo()
      } catch (e) {
        return
      }
      if (cancelled || !info?.enabled) {
        return
      }
      if (!info.updated_at) {
        if (attempts < MAX_ATTEMPTS) {
          timer = setTimeout(check, RETRY_DELAY)
        }
        return
      }

      const daysLeft = getPasswordDaysLeft(info.expiration)
      if (
        !info.expired &&
        (daysLeft === null || daysLeft > PASSWORD_EXPIRATION_WARNING_DAYS)
      ) {
        return
      }

      const today = new Date().toDateString()
      try {
        if (localStorage.getItem(storageKey) === today) {
          return
        }
        localStorage.setItem(storageKey, today)
      } catch (e) {
        // notify anyway
      }

      // the click opens the account settings of the Webphone
      sendSystemNotification(
        info.expired
          ? t('Password.Your password is expired')
          : getPasswordExpiringTitle(daysLeft as number),
        t('Password.Click to change it from the Webphone'),
        '/settings?section=Account',
      )
    }

    timer = setTimeout(check, RETRY_DELAY)
    const interval = setInterval(() => {
      attempts = 0
      check()
    }, CHECK_INTERVAL)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      clearInterval(interval)
    }
  }, [account?.username, account?.host])
}
