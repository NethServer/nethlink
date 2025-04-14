import { t } from 'i18next'
import {
  faKeyboard as KeyboardIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData } from '@renderer/store'
import { OptionElement } from '../OptionElement'

export function SettingsBox() {
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')

  return (
    <div className="py-2">
      <OptionElement
        isSelected={false}
        icon={KeyboardIcon}
        label={t('Settings.ShortcutToCall')}
        onClick={() => setIsShortcutDialogOpen(true)}
      />
    </div>
  )
}
