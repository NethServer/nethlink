import {
  faXmarkCircle as ExitIcon,
  faArrowRightFromBracket as LogoutIcon,
} from '@fortawesome/free-solid-svg-icons'
import { motion } from 'motion/react'
import { ProfileData } from './ProfileDialog/ProfileData'
import { MenuAction } from './ProfileDialog/MenuAction'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { StatusDot } from '@renderer/components/Nethesis'
import { useAccount } from '@renderer/hooks/useAccount'
import { useSharedState } from '@renderer/store'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { MenuPage } from './ProfileDialog/MenuPage'
import { Line } from './ProfileDialog/Line'
import { PresenceBox } from './ProfileDialog/PresenceSettings/PresenceBox'
import { ThemeBox, ThemeIcons } from './ProfileDialog/ThemeSettings/ThemeBox'
import { DeviceBox, DeviceIcons } from './ProfileDialog/DeviceSettings/DeviceBox'

enum MenuItem {
  device = 1,
  presence,
  theme,

}
export const ProfileDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean,
  onClose: () => void
}) => {
  const { status, } = useAccount()
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | undefined>(undefined)
  const [account] = useSharedState('account')
  const [device] = useSharedState('device')
  const [x, setX] = useState(0)
  const [dialogPageTitle, setDialogPageTitle] = useState('')
  const [themeIcon, setThemeIcon] = useState<IconProp>(ThemeIcons['system'])
  const [deviceIcon, setDeviceIcon] = useState<IconProp>(DeviceIcons['nethlink'])
  function handleExitNethLink() {
    window.api.exitNethLink()
  }

  useEffect(() => {
    if (selectedMenu) {
      setX(250)
      switch (selectedMenu) {
        case MenuItem.device: setDialogPageTitle(() => t("TopBar.Device")); break;
        case MenuItem.theme: setDialogPageTitle(() => t("TopBar.Theme")); break;
        case MenuItem.presence: setDialogPageTitle(() => t("TopBar.Presence")); break;
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
      setDeviceIcon(() => DeviceIcons[device || 'nethlink'])
    }

  }, [device])

  useEffect(() => {
    if (account) {
      setThemeIcon(() => ThemeIcons[account?.theme || 'system'])
    }
  }, [account])

  return (
    <div className={
      classNames(
        isOpen ? '' : 'hidden',
        'w-[252px] h-[297px]',
        'bg-bgInput dark:bg-bgInputDark',
        'rounded-lg border dark:border-borderDark border-borderLight',
        'fixed z-[200] right-[56px] top-[54px]'
      )
    } >
      <div className='relative w-full h-full overflow-hidden'>
        <div className='flex flex-col'>
          <ProfileData />
          <Line />
          <div className='py-2'>

            <MenuAction.itemWrap onClick={() => setSelectedMenu(() => MenuItem.presence)} >

              <StatusDot status={status} className='ml-1' />
              <p className="font-normal pl-1">{t('TopBar.Presence')}</p>
            </MenuAction.itemWrap>
            <MenuAction.item onClick={() => setSelectedMenu(() => MenuItem.device)} icon={deviceIcon} label={t("TopBar.Pair device")}
            />
            <MenuAction.item onClick={() => setSelectedMenu(() => MenuItem.theme)} icon={themeIcon} label={t('Settings.Theme')} />
          </div>
          <Line />
          <MenuAction.item className={'py-2'} onClick={handleLogout} icon={LogoutIcon} label={t('TopBar.Logout')} />
          <Line />
          <MenuAction.item className={'py-2'} onClick={handleExitNethLink} icon={ExitIcon} label={t('Common.Quit')} />
        </div>
        <motion.div
          className='absolute top-0 left-full w-full h-full'
          animate={{ x: -x, }}
          transition={{ duration: 0.15, ease: "linear" }}
        >
          <MenuPage
            goBack={() => setSelectedMenu(() => undefined)}
            title={dialogPageTitle}
          >
            {selectedMenu === MenuItem.presence && <PresenceBox />}
            {selectedMenu === MenuItem.device && <DeviceBox />}
            {selectedMenu === MenuItem.theme && <ThemeBox />}
          </MenuPage>

        </motion.div>
      </div>
    </div >
  )
}
