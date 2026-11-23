import {
  faPowerOff as ExitIcon,
  faArrowRightFromBracket as LogoutIcon,
  faGear as SettingsIcon,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'framer-motion'
import { ProfileData } from './ProfileDialog/ProfileData'
import { MenuAction } from './ProfileDialog/MenuAction'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { StatusDot } from '@renderer/components/Nethesis'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { MenuPage } from './ProfileDialog/MenuPage'
import { Line } from './ProfileDialog/Line'
import { PresenceBox } from './ProfileDialog/PresenceSettings/PresenceBox'
import { SettingsBox } from './ProfileDialog/SettingsSettings/SettingsBox'
import { ThemeBox, ThemeIcons } from './ProfileDialog/ThemeSettings/ThemeBox'
import {
  DeviceBox,
  DeviceIcons,
} from './ProfileDialog/DeviceSettings/DeviceBox'
import { Backdrop } from './Backdrop'
import { IconDefinition } from '@nethesis/nethesis-solid-svg-icons'

enum MenuItem {
  device = 1,
  presence,
  theme,
  settings,
}
export const ProfileDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const MENU_WIDTH_PX = 300
  const MENU_SLIDE_PX = MENU_WIDTH_PX - 2
  const { status } = useAccount()
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | undefined>(
    undefined,
  )
  const [account] = useSharedState('account')
  const [device] = useSharedState('device')
  const [x, setX] = useState(0)
  const [dialogPageTitle, setDialogPageTitle] = useState('')
  const [themeIcon, setThemeIcon] = useState<IconProp>(ThemeIcons['system'])
  const [deviceIcon, setDeviceIcon] = useState<
    IconProp | IconDefinition | { Icon: JSX.Element }
  >(DeviceIcons['nethlink'])
  const [isShortcutDialogOpen, setIsShortcutDialogOpen] = useNethlinkData(
    'isShortcutDialogOpen',
  )
  function handleExitNethLink() {
    window.api.exitNethLink()
  }

  // Escape goes back from a submenu, then closes the menu
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (selectedMenu) {
        setSelectedMenu(undefined)
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, selectedMenu, onClose])

  // Reset selectedMenu when the dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMenu(undefined)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedMenu) {
      setX(MENU_SLIDE_PX)
      switch (selectedMenu) {
        case MenuItem.device:
          setDialogPageTitle(() => t('TopBar.Pair device'))
          break
        case MenuItem.theme:
          setDialogPageTitle(() => t('TopBar.Theme'))
          break
        case MenuItem.presence:
          setDialogPageTitle(() => t('TopBar.Presence'))
          break
        case MenuItem.settings:
          setDialogPageTitle(() => t('TopBar.Settings'))
          break
      }
    } else {
      setDialogPageTitle(() => '')
      setX(0)
    }
  }, [selectedMenu])

  function handleLogout() {
    window.api.logout()
  }

  useEffect(() => {
    if (account) {
      setDeviceIcon(() => DeviceIcons[device?.type || 'nethlink'])
    }
  }, [device])

  useEffect(() => {
    if (account) {
      setThemeIcon(() => ThemeIcons[account?.theme || 'system'])
    }
  }, [account])
  if (!isOpen) return <></>
  return (
    <div className={classNames('absolute')}>
      <div
        role='dialog'
        aria-label={t('TopBar.Open user menu') ?? undefined}
        className={classNames(
          'w-[300px] pb-1',
          'bg-bgInput dark:bg-bgInputDark',
          'rounded-lg border border-borderLight shadow-lightXl dark:border-borderDark',
          'fixed right-14 top-14 z-[200]',
        )}
      >
        <div className='relative w-full h-full overflow-hidden'>
          <div className='flex flex-col'>
            <ProfileData />
            <Line />
            <div>
              <MenuAction.itemWrap
                onClick={() => setSelectedMenu(() => MenuItem.presence)}
              >
                <span className='flex size-4 shrink-0 items-center justify-center'>
                  <StatusDot status={status} />
                </span>
                <span>{t('TopBar.Presence')}</span>
                <MenuAction.chevron />
              </MenuAction.itemWrap>
              <MenuAction.item
                onClick={() => setSelectedMenu(() => MenuItem.theme)}
                icon={themeIcon}
                label={t('TopBar.Theme')}
                chevronVisible
              />
              <MenuAction.item
                onClick={() => setSelectedMenu(() => MenuItem.device)}
                label={t('TopBar.Pair device')}
                {...(deviceIcon?.hasOwnProperty('Icon')
                  ? {
                      iconElem: (deviceIcon as { Icon: JSX.Element }).Icon,
                    }
                  : {
                      icon: deviceIcon as IconProp,
                    })}
                chevronVisible
              />

              <MenuAction.item
                onClick={() => setSelectedMenu(() => MenuItem.settings)}
                icon={SettingsIcon}
                label={t('TopBar.Settings')}
                chevronVisible
              />
            </div>
            <Line />
            <MenuAction.item
              onClick={handleLogout}
              icon={LogoutIcon}
              label={t('TopBar.Sign out')}
            />
            <Line />
            <MenuAction.item
              onClick={handleExitNethLink}
              icon={ExitIcon}
              label={t('Common.Quit')}
            />
          </div>
          <motion.div
            className='absolute top-0 left-full h-full w-[calc(100%+1px)]'
            animate={{ x: -x }}
            transition={{ duration: 0.15, ease: 'linear' }}
          >
            <MenuPage
              goBack={() => setSelectedMenu(() => undefined)}
              title={dialogPageTitle}
            >
              {selectedMenu === MenuItem.presence && (
                <PresenceBox onClose={onClose} />
              )}
              {selectedMenu === MenuItem.device && <DeviceBox />}
              {selectedMenu === MenuItem.theme && <ThemeBox />}
              {selectedMenu === MenuItem.settings && (
                <SettingsBox onClose={onClose} />
              )}
            </MenuPage>
          </motion.div>
        </div>
      </div>
      <Backdrop
        className={classNames('z-[199]')}
        onBackdropClick={() => {
          setSelectedMenu(() => undefined)
          onClose()
        }}
      />
    </div>
  )
}
