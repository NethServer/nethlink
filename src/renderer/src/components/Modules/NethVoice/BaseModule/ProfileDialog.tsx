import {
  faXmarkCircle as ExitIcon,
  faAngleRight,
  faArrowRightFromBracket as LogoutIcon,
  faGear as SettingsIcon,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'motion/react'
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

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

  // Reset selectedMenu when the dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMenu(undefined)
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedMenu) {
      setX(250)
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
        className={classNames(
          'w-[252px] h-[333px]',
          'bg-bgInput dark:bg-bgInputDark',
          'rounded-lg border dark:border-borderDark border-borderLight',
          'fixed z-[200] right-[58px] top-[54px]',
        )}
      >
        <div className='relative w-full h-full overflow-hidden'>
          <div className='flex flex-col'>
            <ProfileData />
            <Line />
            <div className='py-2'>
              <MenuAction.itemWrap
                onClick={() => setSelectedMenu(() => MenuItem.presence)}
              >
                <StatusDot status={status} className='ml-1' />
                <p className='font-normal pl-1'>{t('TopBar.Presence')}</p>
                <FontAwesomeIcon
                  icon={faAngleRight}
                  className='ml-auto h-4 w-4 flex justify-center'
                />
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
              className={'py-2'}
              onClick={handleLogout}
              icon={LogoutIcon}
              label={t('TopBar.Logout')}
            />
            <Line />
            <MenuAction.item
              className={'py-2'}
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
