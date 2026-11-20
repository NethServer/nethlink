import { Button } from '@renderer/components/Nethesis'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { useAccount } from '@renderer/hooks/useAccount'
import { parseThemeToClassName, sendNotification } from '@renderer/utils'
import classNames from 'classnames'

export function SettingsNotificationsDialog() {
  const tooltipId = 'tooltip-call-summary-notifications-info'
  const [, setIsNotificationsDialogOpen] = useNethlinkData(
    'isNotificationsDialogOpen',
  )
  const [account] = useSharedState('account')
  const [theme] = useSharedState('theme')
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const { updateAccountData } = useAccount()
  const [isSaving, setIsSaving] = useState(false)
  const isCallSummaryEnabled = account?.data?.call_summary_enabled === true
  const [callSummaryNotifications, setCallSummaryNotifications] = useState<
    boolean | null
  >(() => {
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
    <Modal
      show={true}
      focus={cancelButtonRef}
      onClose={() => setIsNotificationsDialogOpen(false)}
      themeMode={parseThemeToClassName(theme)}
    >
      <form
        onSubmit={handleSubmit}
        className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col gap-6 p-6 text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'
      >
        <div className='flex flex-col gap-2'>
          <DialogTitle className='text-lg font-medium leading-7'>
            {t('Settings.Notifications')}
          </DialogTitle>
          <div className='space-y-1 text-sm leading-5 text-gray-600 dark:text-gray-400'>
            <p>{t('Settings.NotificationsDescription')}</p>
            <p>{t('Settings.NotificationsScopeDescription')}</p>
          </div>
        </div>
        {/* the title and the buttons stay in view: only this part scrolls */}
        <div className='-mx-6 -my-1 flex min-h-0 flex-col gap-6 overflow-y-auto px-6 py-1'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2 text-textSecondaryNeutral dark:text-textSecondaryNeutralDark'>
              <span className='font-Poppins text-sm font-medium leading-5'>
                {t('Settings.CallTranscriptionReady')}
              </span>
              <button
                type='button'
                className='inline-flex h-4 w-4 items-center justify-center rounded-full text-iconTooltip focus:outline-none focus:ring-2 focus:ring-primaryRing focus:ring-offset-2 focus:ring-offset-elevationL1 dark:text-iconTooltipDark dark:focus:ring-primaryRingDark dark:focus:ring-offset-bgDark'
                aria-label={
                  t('Settings.CallSummaryNotificationsDescription') as string
                }
                data-tooltip-id={tooltipId}
                data-tooltip-content={
                  t('Settings.CallSummaryNotificationsDescription') as string
                }
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
                      callSummaryNotifications
                        ? 'translate-x-5'
                        : 'translate-x-0',
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
        </div>
        {/* as the modals of the design system: cancel, then the primary action, on the right */}
        <div className='flex justify-end gap-3'>
          <Button
            ref={cancelButtonRef}
            type='button'
            variant='white'
            onClick={handleCancel}
          >
            {t('Common.Cancel')}
          </Button>
          <Button
            type='submit'
            disabled={isSaving || callSummaryNotifications === null}
          >
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
