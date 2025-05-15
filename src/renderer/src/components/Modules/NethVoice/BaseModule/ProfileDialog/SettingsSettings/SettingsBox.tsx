import { t } from 'i18next'
import {
  faKeyboard as KeyboardIcon,
  faSignal as DevicesIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData } from '@renderer/store'
import { OptionElement } from '../OptionElement'

export function SettingsBox({ onClose }: { onClose?: () => void }) {
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [, setIsDeviceDialogOpen] = useNethlinkData('isDeviceDialogOpen')

  return (
    <div className="py-2">
      <OptionElement
        isSelected={false}
        icon={KeyboardIcon}
        label={t('Settings.ShortcutToCall')}
        onClick={() => {
          setIsShortcutDialogOpen(true)
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
    </div>
  )
}
