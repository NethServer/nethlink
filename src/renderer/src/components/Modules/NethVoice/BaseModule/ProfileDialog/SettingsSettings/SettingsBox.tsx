import { useEffect, useState } from 'react'
import { t } from 'i18next'
import {
  faPhone as PhoneIcon,
  faKeyboard as KeyboardIcon,
  faHeadphones as DevicesIcon,
  faPhoneVolume as IncomingCallsIcon,
  faBell as NotificationsIcon,
  faKey as PasswordIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { isSsoMethod } from '@shared/types'
import { OptionElement } from '../OptionElement'

// whether the password can be changed, per account: it does not change while
// the app runs, read it once
const passwordAvailability = new Map<string, boolean>()

export function SettingsBox({ onClose }: { onClose?: () => void }) {
  const [account] = useSharedState('account')
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [, setIsCommandBarShortcutDialogOpen] = useNethlinkData(
    'isCommandBarShortcutDialogOpen',
  )
  const [, setIsDeviceDialogOpen] = useNethlinkData('isDeviceDialogOpen')
  const [, setIsIncomingCallsDialogOpen] = useNethlinkData(
    'isIncomingCallsDialogOpen',
  )
  const [, setIsNotificationsDialogOpen] = useNethlinkData(
    'isNotificationsDialogOpen',
  )
  const [, setIsChangePasswordDialogOpen] = useNethlinkData(
    'isChangePasswordDialogOpen',
  )
  const isCallSummaryEnabled = account?.data?.call_summary_enabled === true
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  // the password can be changed only with an account provider of NS8
  const accountKey = `${account?.username}@${account?.host}`
  const [isPasswordAvailable, setIsPasswordAvailable] = useState(
    passwordAvailability.get(accountKey) ?? false,
  )

  useEffect(() => {
    if (
      isSsoMethod(account?.authenticationMethod) ||
      passwordAvailability.has(accountKey)
    ) {
      return
    }
    NethVoiceAPI.User.passwordInfo()
      .then((info) => {
        passwordAvailability.set(accountKey, !!info?.enabled)
        setIsPasswordAvailable(!!info?.enabled)
      })
      .catch(() => setIsPasswordAvailable(false))
  }, [accountKey])

  return (
    <div className='py-2'>
      <OptionElement
        isSelected={false}
        icon={PhoneIcon}
        label={t('Settings.ShortcutToCall')}
        onClick={() => {
          setIsShortcutDialogOpen(true)
          if (onClose) onClose()
        }}
      />
      <OptionElement
        isSelected={false}
        icon={KeyboardIcon}
        label={t('Settings.CommandBarShortcut')}
        onClick={() => {
          setIsCommandBarShortcutDialogOpen(true)
          if (onClose) onClose()
        }}
      />
      <OptionElement
        isSelected={false}
        icon={DevicesIcon}
        label={t('Settings.Devices')}
        onClick={() => {
          setIsDeviceDialogOpen(true)
          if (onClose) onClose()
        }}
      />
      <OptionElement
        isSelected={false}
        icon={IncomingCallsIcon}
        label={t('Settings.IncomingCalls')}
        onClick={() => {
          setIsIncomingCallsDialogOpen(true)
          if (onClose) onClose()
        }}
      />
      {isCallSummaryEnabled && (
        <OptionElement
          isSelected={false}
          icon={NotificationsIcon}
          label={t('Settings.Notifications')}
          onClick={() => {
            setIsNotificationsDialogOpen(true)
            if (onClose) onClose()
          }}
        />
      )}
      {isPasswordAvailable && (
        <OptionElement
          isSelected={false}
          icon={PasswordIcon}
          label={t('Password.Change password')}
          onClick={() => {
            setIsChangePasswordDialogOpen(true)
            if (onClose) onClose()
          }}
        />
      )}
    </div>
  )
}
