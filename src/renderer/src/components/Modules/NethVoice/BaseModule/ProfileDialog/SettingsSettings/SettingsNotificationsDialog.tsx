import { Button } from '@renderer/components/Nethesis'
import { Backdrop } from '../../Backdrop'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { useAccount } from '@renderer/hooks/useAccount'
import { sendNotification } from '@renderer/utils'
import classNames from 'classnames'

export function SettingsNotificationsDialog() {
  const tooltipId = 'tooltip-call-summary-notifications-info'
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
          <div className='pointer-events-auto w-full max-w-[344px] rounded-lg bg-elevationL1 px-4 pb-4 pt-5 text-textPrimaryNeutral shadow-lightXl dark:bg-bgDark dark:text-textPrimaryNeutralDark'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
              <div className='flex flex-col items-center gap-4 text-center'>
                <h2 className='font-Poppins text-lg font-medium leading-7'>
                  {t('Settings.Notifications')}
                </h2>
                <div className='space-y-1 text-xs leading-4 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
                  <p>{t('Settings.NotificationsDescription')}</p>
                  <p>{t('Settings.NotificationsScopeDescription')}</p>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
                  <span className='font-Poppins text-sm font-medium leading-5'>
                    {t('Settings.CallTranscriptionReady')}
                  </span>
                  <button
                    type='button'
                    className='inline-flex h-4 w-4 items-center justify-center rounded-full text-iconTooltip focus:outline-none focus:ring-2 focus:ring-primaryRing focus:ring-offset-2 focus:ring-offset-elevationL1 dark:text-iconTooltipDark dark:focus:ring-primaryRingDark dark:focus:ring-offset-bgDark'
                    aria-label={t('Settings.CallSummaryNotificationsDescription') as string}
                    data-tooltip-id={tooltipId}
                    data-tooltip-content={t('Settings.CallSummaryNotificationsDescription') as string}
                    data-tooltip-place='top'
                  >
                    <FontAwesomeIcon icon={faCircleInfo} className='text-base' />
                  </button>
                  <CustomThemedTooltip id={tooltipId} place='top' />
                </div>

                <label
                  htmlFor='call-summary-notifications'
                  className='flex items-center gap-4 self-start cursor-pointer'
                >
                  {callSummaryNotifications !== null ? (
                    <button
                      id='call-summary-notifications'
                      type='button'
                      role='switch'
                      aria-checked={callSummaryNotifications}
                      aria-label={t('Settings.CallTranscriptionReady') as string}
                      onClick={() => {
                        setCallSummaryNotifications((prev) => !prev)
                      }}
                      className={classNames(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-out',
                        'focus:outline-none focus:ring-2 focus:ring-primaryRing focus:ring-offset-2 focus:ring-offset-elevationL1 dark:focus:ring-primaryRingDark dark:focus:ring-offset-bgDark',
                        callSummaryNotifications
                          ? 'bg-productPrimaryNethlinkActive dark:bg-productPrimaryNethlinkActiveDark'
                          : 'bg-surfaceToggleBackgroundDisabled dark:bg-surfaceToggleBackgroundDisabledDark',
                      )}
                    >
                      <span
                        aria-hidden='true'
                        className={classNames(
                          'block h-[18px] w-[18px] rounded-full bg-white shadow-lightXs transition-transform duration-200 ease-out',
                          callSummaryNotifications ? 'translate-x-5' : 'translate-x-0',
                        )}
                      />
                    </button>
                  ) : (
                    <div className='h-6 w-11 shrink-0 rounded-full bg-surfaceToggleBackgroundDisabled/50 dark:bg-surfaceToggleBackgroundDisabledDark/50 animate-pulse' />
                  )}

                  <span className='pt-0.5 text-sm leading-5 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
                    {t(
                      callSummaryNotifications
                        ? 'Settings.Enabled'
                        : 'Settings.Disabled',
                    )}
                  </span>
                </label>
              </div>

              <div className='flex flex-col gap-3'>
                <Button
                  type='submit'
                  disabled={isSaving || callSummaryNotifications === null}
                  className='w-full rounded-md py-2 shadow-lightXs'
                >
                  {t('Common.Save')}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={handleCancel}
                  className='w-full justify-center rounded-md py-2 text-productPrimaryNethlinkActive hover:bg-transparent dark:text-productPrimaryNethlinkActiveDark dark:hover:bg-transparent'
                >
                  {t('Common.Cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
