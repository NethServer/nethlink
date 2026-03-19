import { Button } from '@renderer/components/Nethesis'
import { Backdrop } from '../../Backdrop'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { useAccount } from '@renderer/hooks/useAccount'
import { sendNotification } from '@renderer/utils'
import classNames from 'classnames'

export function SettingsNotificationsDialog() {
  const [, setIsNotificationsDialogOpen] = useNethlinkData('isNotificationsDialogOpen')
  const [account] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const { updateAccountData } = useAccount()
  const [isSaving, setIsSaving] = useState(false)
  const isCallSummaryEnabled = account?.data?.call_summary_enabled === true
  const [callSummaryNotifications, setCallSummaryNotifications] = useState<boolean | null>(() => {
    if (!account?.data?.settings || !isCallSummaryEnabled) {
      return null
    }

    return account.data.settings.call_summary_notifications !== false
  })

  useEffect(() => {
    if (!isCallSummaryEnabled) {
      setIsNotificationsDialogOpen(false)
      return
    }

    if (callSummaryNotifications === null && account?.data?.settings) {
      setCallSummaryNotifications(
        account.data.settings.call_summary_notifications !== false,
      )
    }
  }, [
    account?.data?.settings,
    callSummaryNotifications,
    isCallSummaryEnabled,
    setIsNotificationsDialogOpen,
  ])

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsNotificationsDialogOpen(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()

    if (isSaving) {
      return
    }
    if (!isCallSummaryEnabled || callSummaryNotifications === null) {
      return
    }

    setIsSaving(true)
    try {
      await NethVoiceAPI.User.settings({
        call_summary_notifications: callSummaryNotifications,
      })
      await updateAccountData()
      setIsNotificationsDialogOpen(false)
    } catch (error) {
      sendNotification(
        t('Common.Warning'),
        t('Settings.CallSummaryNotificationsSaveError'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />
      <Backdrop
        className='z-[202]'
        onBackdropClick={() => setIsNotificationsDialogOpen(false)}
      />
      <div className='fixed inset-0 z-[205] overflow-y-auto pointer-events-none'>
        <div className='flex min-h-full items-center justify-center p-4 pointer-events-none'>
          <div className='bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-xl shadow-lg max-w-sm w-full pointer-events-auto'>
            <div className='p-6 flex flex-col gap-5'>
              <h2 className='text-center font-semibold text-xl'>
                {t('Settings.Notifications')}
              </h2>
              <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
                <div className='flex items-start gap-3 rounded-lg border border-borderLight dark:border-borderDark p-4'>
                  <FontAwesomeIcon icon={faBell} className='mt-1 text-base' />
                  <div className='flex-1'>
                    <label
                      htmlFor='call-summary-notifications'
                      className='flex items-start justify-between gap-4 cursor-pointer'
                    >
                      <div className='flex flex-col gap-1'>
                        <span className='font-medium'>
                          {t('Settings.CallSummaryNotifications')}
                        </span>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          {t('Settings.CallSummaryNotificationsDescription')}
                        </span>
                      </div>
                      {callSummaryNotifications !== null ? (
                        <button
                          id='call-summary-notifications'
                          type='button'
                          role='switch'
                          aria-checked={callSummaryNotifications}
                          onClick={() => {
                            setCallSummaryNotifications((prev) => !prev)
                          }}
                          className={classNames(
                            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors duration-200 ease-out',
                            'appearance-none focus:outline-none focus:ring-2 focus:ring-primaryRing dark:focus:ring-primaryRingDark',
                            callSummaryNotifications
                              ? 'bg-primary dark:bg-primaryDark'
                              : 'bg-gray-300 dark:bg-gray-600',
                          )}
                        >
                          <span
                            aria-hidden='true'
                            className={classNames(
                              'block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
                              callSummaryNotifications ? 'translate-x-5' : 'translate-x-0',
                            )}
                          />
                        </button>
                      ) : (
                        <div className='h-7 w-12 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse' />
                      )}
                    </label>
                  </div>
                </div>
                <div className='flex justify-end gap-3'>
                  <Button type='button' variant='ghost' onClick={handleCancel}>
                    {t('Common.Cancel')}
                  </Button>
                  <Button type='submit' disabled={isSaving || callSummaryNotifications === null}>
                    {t('Common.Save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
