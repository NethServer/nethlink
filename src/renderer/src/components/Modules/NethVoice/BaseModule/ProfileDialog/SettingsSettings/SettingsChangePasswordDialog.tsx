import { useEffect, useState } from 'react'
import { t } from 'i18next'
import { format } from 'date-fns'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'
import { PasswordChangeForm } from '@renderer/components/pageComponents/password/PasswordChangeForm'
import { getLocale } from '@renderer/lib/dateTime'
import {
  getPasswordDaysLeft,
  getPasswordExpiringTitle,
  PASSWORD_EXPIRATION_WARNING_DAYS,
} from '@renderer/lib/password'
import { parseThemeToClassName, sendNotification } from '@renderer/utils'
import { IPC_EVENTS } from '@shared/constants'
import { PasswordInfo } from '@shared/types'
import { decodeJWT } from '@shared/utils/jwt'

const formatDate = (date: Date) =>
  format(date, 'd MMM yyyy', { locale: getLocale() })

export function SettingsChangePasswordDialog() {
  const [, setIsChangePasswordDialogOpen] = useNethlinkData(
    'isChangePasswordDialogOpen',
  )
  const [account] = useSharedState('account')
  const [theme] = useSharedState('theme')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const [info, setInfo] = useState<PasswordInfo | undefined>(undefined)

  useEffect(() => {
    NethVoiceAPI.User.passwordInfo()
      .then(setInfo)
      .catch(() => undefined)
  }, [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  // not while submitting, or the result would not be shown
  const close = () => {
    if (!isSubmitting) setIsChangePasswordDialogOpen(false)
  }

  const expirationStatus = () => {
    if (!info?.expiration) {
      return null
    }
    const daysLeft = getPasswordDaysLeft(info.expiration)
    if (info.expired) {
      // the session lasts a fixed time after the login, also when the
      // password expires in the meantime
      const exp = account?.jwtToken ? decodeJWT(account.jwtToken)?.exp : null
      return (
        <InlineNotification
          type='error'
          title={
            daysLeft !== null && daysLeft < 0
              ? t('Password.Password expired {{count}} days ago', {
                  count: -daysLeft,
                })
              : daysLeft === 0
                ? t('Password.Password expired today')
                : // forced change by the administrator: the expiration is still ahead
                  t('Password.Your password is expired')
          }
        >
          <p>
            {exp
              ? t(
                  'Password.You can continue until {{date}}, then you must change it',
                  { date: formatDate(new Date(exp * 1000)) },
                )
              : t('Password.Change it now to keep using the application')}
          </p>
        </InlineNotification>
      )
    }
    const expiresOn = t('Password.Password expires on {{date}}', {
      date: formatDate(new Date(info.expiration)),
    })
    if (daysLeft !== null && daysLeft <= PASSWORD_EXPIRATION_WARNING_DAYS) {
      return (
        <InlineNotification
          type='warning'
          title={getPasswordExpiringTitle(daysLeft)}
        >
          <p>{expiresOn}</p>
        </InlineNotification>
      )
    }
    return <p>{expiresOn}</p>
  }

  // the expiration of the password, when there is something to say
  const status = expirationStatus()

  return (
    // the first password field gets the focus
    <Modal show={true} onClose={close} themeMode={parseThemeToClassName(theme)}>
      {/* taller than the default window: the title and the buttons stay, the fields scroll */}
      <div className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'>
        <div className='flex shrink-0 flex-col gap-2 px-6 pb-6 pt-6'>
          <DialogTitle className='text-lg font-medium leading-7'>
            {t('Password.Change password')}
          </DialogTitle>
          <p className='text-sm leading-5 text-gray-600 dark:text-gray-400'>
            {t(
              'Password.Update the password used to sign in to Web phone and Desktop app.',
            )}
          </p>
        </div>
        {/* the fields scroll, the title and the buttons stay in view */}
        <PasswordChangeForm
          layout='dialog'
          intro={
            status ? (
              <div className='text-sm leading-5 text-gray-600 dark:text-gray-400'>
                {status}
              </div>
            ) : undefined
          }
          policy={info?.policy || null}
          submitLabel={t('Password.Change') || ''}
          onSubmit={async (current, next) => {
            setIsSubmitting(true)
            try {
              await NethVoiceAPI.User.changePassword(current, next)
            } finally {
              setIsSubmitting(false)
            }
          }}
          onSuccess={(newPassword) => {
            // keep the stored password in sync for the auto login
            window.electron.send(IPC_EVENTS.UPDATE_PASSWORD, newPassword)
            sendNotification(
              t('Password.Password updated'),
              t('Password.Account password has been updated'),
            )
            setIsChangePasswordDialogOpen(false)
          }}
          onCancel={close}
        />
      </div>
    </Modal>
  )
}
