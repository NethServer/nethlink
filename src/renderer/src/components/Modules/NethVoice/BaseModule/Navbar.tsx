import { Avatar } from '../../../Nethesis/Avatar'

import { useAccount } from '@renderer/hooks/useAccount'
import { debouncer } from '@shared/utils/utils'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useState } from 'react'
import classNames from 'classnames'
import { PresenceBadge } from './ProfileDialog/PresenceSettings/PresenceBadge'
import { SearchBox } from '../SearchResults/SearchBox'
import { ProfileDialog } from './ProfileDialog'
import { PresenceForwardDialog } from './ProfileDialog/PresenceSettings/PresenceForwardDialog'
import { SettingsShortcutDialog } from './ProfileDialog/SettingsSettings/SettingsShortcutDialog'
import { SettingsDeviceDialog } from './ProfileDialog/SettingsSettings/SettingsDevicesDialog'

export interface NavbarProps {
  onClickAccount: () => void
}

export function Navbar({ onClickAccount }: NavbarProps): JSX.Element {
  const { status } = useAccount()
  const [account] = useSharedState('account')
  const [operators] = useNethlinkData('operators')
  const [isForwardDialogOpen] = useNethlinkData('isForwardDialogOpen')
  const [isShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [isDeviceDialogOpen] = useNethlinkData('isDeviceDialogOpen')

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  if (!account) return <></>

  return (
    <>
      <div className='flex flex-row items-center justify-between gap-4 px-4 pt-2'>
        <SearchBox />
        <div className='flex flex-row min-w-30 gap-2 items-center'>
          <PresenceBadge className={classNames()} />

          <div className={'max-h-8'}>
            <div
              className='cursor-pointer dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-full  '
              onClick={() => {
                setIsProfileDialogOpen((p) => !p)
                debouncer('reload_me', onClickAccount, 1000)
              }}
            >
              <Avatar
                size='small'
                status={status}
                src={operators?.avatars?.[account.username] || undefined}
                placeholderType='operator'
              />
            </div>
          </div>
        </div>
      </div>
      {isForwardDialogOpen && <PresenceForwardDialog />}
      {isShortcutDialogOpen && <SettingsShortcutDialog />}
      {isDeviceDialogOpen && <SettingsDeviceDialog />}
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </>
  )
}
