import {
  faPalette as SystemIcon,
  faSun as LightIcon,
  faMoon as DarkIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useSharedState } from "@renderer/store"
import { Account } from "@shared/types"
import { getAccountUID } from "@shared/utils/utils"
import { t } from "i18next"
import { OptionElement } from "../OptionElement"
import { Log } from "@shared/utils/logger"
import { IPC_EVENTS } from '@shared/constants'

export const ThemeIcons = {
  system: SystemIcon,
  light: LightIcon,
  dark: DarkIcon
}
export const ThemeBox = () => {
  const [account, setAccount] = useSharedState('account')
  const [, setAuth] = useSharedState('auth')
  const [, setTheme] = useSharedState('theme')
  function handleSetTheme(theme) {
    Log.info('change theme to', theme)
    setTheme(() => theme)
    const updatedAccount = { ...account!, theme: theme }
    setAccount(() => updatedAccount)
    setAuth((p) => ({
      ...p,
      isFirstStart: p?.isFirstStart ?? true,
      availableAccounts: {
        ...p?.availableAccounts,
        [getAccountUID(updatedAccount as Account)]: updatedAccount
      }
    }))
    window.electron.send(IPC_EVENTS.CHANGE_THEME, theme)
  }

  const themeOptions = [
    { id: 1, name: 'system', icon: ThemeIcons.system, label: t('Settings.System') },
    { id: 2, name: 'light', icon: ThemeIcons.light, label: t('Settings.Light') },
    { id: 3, name: 'dark', icon: ThemeIcons.dark, label: t('Settings.Dark') }
  ]


  if (!account) return <></>
  return (
    <div className="py-2">
      {themeOptions.map((availableTheme) => (
        <OptionElement
          key={availableTheme.id}
          icon={availableTheme.icon}
          label={availableTheme.label}
          isSelected={account.theme === availableTheme.name}
          onClick={() => handleSetTheme(availableTheme.name)}
        />
      ))}
    </div>
  )
}
