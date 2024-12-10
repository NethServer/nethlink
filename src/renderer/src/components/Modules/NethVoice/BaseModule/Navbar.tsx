import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmarkCircle as ExitIcon,
  faGear as ThemeMenuIcon,
  faArrowRightFromBracket as LogoutIcon,
  faPalette as SystemIcon,
  faSun as LightIcon,
  faMoon as DarkIcon,
  faCheck as ChooseThemeMenuIcon,
  faArrowUpRightFromSquare as GoToNethVoiceIcon
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '../../../Nethesis/Avatar'
import { Listbox, Menu } from '@headlessui/react'
import { Account } from '@shared/types'
import { t } from 'i18next'
import { StatusDot } from '../../../Nethesis'
import { useAccount } from '@renderer/hooks/useAccount'
import { debouncer, getAccountUID, isDev } from '@shared/utils/utils'
import { useSharedState } from '@renderer/store'
import { createRef, useState } from 'react'
import { useTheme } from '@renderer/theme/Context'
import { PresenceBox } from './ProfileDialog/PresenceSettings/PresenceBox'
import classNames from 'classnames'
import { truncate } from 'lodash'
import { PresenceBadge } from './ProfileDialog/PresenceSettings/PresenceBadge'
import { SearchBox } from '../SearchResults/SearchBox'
import { ThemeBox } from './ProfileDialog/ThemeSettings/ThemeBox'
import { ProfileDialog } from './ProfileDialog'

export interface NavbarProps {
  onClickAccount: () => void
}

export function Navbar({ onClickAccount }: NavbarProps): JSX.Element {

  const { status } = useAccount()
  const [account] = useSharedState('account')
  const [operators] = useSharedState('operators')

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  if (!account) return <></>

  return (
    <div className="flex flex-row items-center justify-between gap-4 px-4 pt-2">
      <SearchBox />
      <div className="flex flex-row min-w-30 gap-2 items-center">
        <PresenceBadge
          mainPresence={account?.data?.mainPresence}
          className={classNames()}
        />

        <div className={'max-h-8'}>
          <div
            className="cursor-pointer dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-full  "
            onClick={() => {
              setIsProfileDialogOpen((p) => !p)
              debouncer('reload_me', onClickAccount, 1000)
            }}
          >
            <Avatar
              size="small"
              status={status}
              src={operators?.avatars?.[account.username] || undefined}
              placeholderType="operator"
            />
          </div>
        </div>
      </div>
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </div >
  )
}
