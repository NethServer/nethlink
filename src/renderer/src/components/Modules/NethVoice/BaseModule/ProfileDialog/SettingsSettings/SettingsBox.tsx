import { t } from 'i18next'
import {
  faPhone as PhoneIcon,
  faKeyboard as KeyboardIcon,
  faHeadphones as DevicesIcon,
  faPhoneVolume as IncomingCallsIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData } from '@renderer/store'
import { OptionElement } from '../OptionElement'

export function SettingsBox({ onClose }: { onClose?: () => void }) {
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [, setIsCommandBarShortcutDialogOpen] = useNethlinkData(
    'isCommandBarShortcutDialogOpen',
  )
  const [, setIsDeviceDialogOpen] = useNethlinkData('isDeviceDialogOpen')
  const [, setIsIncomingCallsDialogOpen] = useNethlinkData('isIncomingCallsDialogOpen')

  return (
    <div className="py-2">
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
    </div>
  )
}
