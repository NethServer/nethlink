import { useEffect, useState } from 'react'
import { t } from 'i18next'
import { format } from 'date-fns'
import { Backdrop } from '../../Backdrop'
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
import { sendNotification } from '@renderer/utils'
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
    return <p className='text-center'>{expiresOn}</p>
  }

  return (
    <>
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />
      <Backdrop className='z-[202]' onBackdropClick={close} />
      <div className='fixed inset-0 z-[205] pointer-events-none'>
        <div className='flex h-full items-center justify-center p-4 pointer-events-none'>
          {/* taller than the default window: the title stays, the content scrolls */}
          <div className='pointer-events-auto flex max-h-full w-full max-w-[384px] flex-col rounded-lg bg-elevationL1 pt-5 text-textPrimaryNeutral shadow-lightXl dark:bg-bgDark dark:text-textPrimaryNeutralDark'>
            <div className='flex shrink-0 flex-col items-center gap-2 px-4 pb-4 text-center'>
              <h2 className='font-Poppins text-lg font-medium leading-7'>
                {t('Password.Change password')}
              </h2>
              <p className='text-xs leading-4 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
                {t(
                  'Password.Update the password used to sign in to Web phone and Desktop app.',
                )}
              </p>
            </div>
            <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-4'>
              <div className='text-xs leading-4 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
                {expirationStatus()}
              </div>
              <PasswordChangeForm
                policy={info?.policy || null}
                submitLabel={t('Password.Change password') || ''}
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
          </div>
        </div>
      </div>
    </>
  )
}
