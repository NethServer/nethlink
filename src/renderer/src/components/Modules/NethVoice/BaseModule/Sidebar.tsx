import { useEffect, useRef, useState } from 'react'
import {
  faBolt as SpeedDialMenuIcon,
  faClockRotateLeft as MissedCallMenuIcon,
  faInfoCircle as InfoMenuIcon,
  faStar as FavouriteMenuIcon,
  faSquareParking as ParkedCallMenuIcon,
  faMessage as ChatMenuIcon,
  faUsers as QueuesMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { ParkingType } from '@shared/types'
import { MENU_ELEMENT, PERMISSION } from '@shared/constants'
import { useAccount } from '@renderer/hooks/useAccount'
import { difference } from 'lodash'
import { useParkingModule } from '../Parking/hook/useParkingModule'
import { SidebarButton } from '@renderer/components/SidebarButton'
import { t } from 'i18next'

export interface SidebarProps {
  onChangeMenu: (menuElement: MENU_ELEMENT) => void
}

export function Sidebar({ onChangeMenu }: SidebarProps): JSX.Element {
  const [selectedSidebarMenu, setSelectedSidebarMenu] = useNethlinkData(
    'selectedSidebarMenu',
  )
  const [, setShowPhonebookSearchModule] = useNethlinkData(
    'showPhonebookSearchModule',
  )
  const [, setPhonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const [missedCalls] = useNethlinkData('missedCalls')
  const [chatStatus] = useNethlinkData('chatStatus')
  const [chatUnread] = useNethlinkData('chatUnread')
  const [notifications] = useSharedState('notifications')
  const [lastMenu, setLastMenu] = useState<MENU_ELEMENT>(
    MENU_ELEMENT.FAVOURITES,
  )
  const [isAboutVisited, setIsAboutVisited] = useState<boolean>(false)

  const viewedParkedCalls = useRef<ParkingType[]>([])
  const [parkedPulse, setParkedPulse] = useState<boolean>(false)

  const { hasPermission, hasMacroPermission } = useAccount()
  const { parkedCalls } = useParkingModule()

  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setSelectedSidebarMenu(menuElement)
    setShowPhonebookSearchModule(false)
    setPhonebookSearchModule({
      searchText: undefined,
    })
  }

  useEffect(() => {
    if (selectedSidebarMenu && lastMenu !== selectedSidebarMenu) {
      setLastMenu(() => selectedSidebarMenu)
      onChangeMenu(selectedSidebarMenu)
      if (!isAboutVisited && selectedSidebarMenu === MENU_ELEMENT.ABOUT) {
        setIsAboutVisited(() => true)
      }
    }
  }, [selectedSidebarMenu])

  // back to the default section when the queues permission is removed while
  // the queues are shown; only once the profile is loaded
  const [account] = useSharedState('account')
  const isProfileLoaded = !!account?.data?.profile?.macro_permissions
  const canUseQueues = hasMacroPermission('queue_agent')
  useEffect(() => {
    if (
      isProfileLoaded &&
      !canUseQueues &&
      selectedSidebarMenu === MENU_ELEMENT.QUEUES
    ) {
      handleSidebarMenuSelection(MENU_ELEMENT.FAVOURITES)
    }
  }, [isProfileLoaded, canUseQueues, selectedSidebarMenu])

  useEffect(() => {
    if (selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS) {
      viewedParkedCalls.current = [...(parkedCalls || [])]
    }
    const currentNames = parkedCalls?.map((c) => c.parkedCaller.name) || []
    viewedParkedCalls.current = viewedParkedCalls.current.filter((p) =>
      currentNames.includes(p.parkedCaller.name),
    )
    const names = viewedParkedCalls.current.map((c) => c.parkedCaller.name)
    const diff = difference(currentNames, names)
    if (diff.length > 0) {
      setParkedPulse(true)
    }
  }, [parkedCalls, selectedSidebarMenu])

  return (
    <nav className='z-10 flex h-full w-12 shrink-0 flex-col justify-between border-l border-borderLight bg-bgLight px-2 pb-2 pt-4 dark:border-borderDark dark:bg-bgDark'>
      <div className='flex flex-col items-center gap-5'>
        {/* FAVOURITE */}
        <SidebarButton
          icon={FavouriteMenuIcon}
          label={t('SpeedDial.Favourites')}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.FAVOURITES)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.FAVOURITES}
        />
        {/* SPEEDDIALS */}
        <SidebarButton
          icon={SpeedDialMenuIcon}
          label={t('SpeedDial.Speed dial')}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.SPEEDDIALS)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.SPEEDDIALS}
        />
        {/* LAST CALLS */}
        <SidebarButton
          icon={MissedCallMenuIcon}
          label={t('LastCalls.Last calls')}
          hasNotification={!!missedCalls && missedCalls.length > 0}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.LAST_CALLS)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.LAST_CALLS}
        />
        {/* CHAT: shown once the chat window is connecting */}
        {chatStatus && (
          <SidebarButton
            icon={ChatMenuIcon}
            label={t('Chat.Messages')}
            hasNotification={(chatUnread || 0) > 0}
            onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.CHAT)}
            isSelected={selectedSidebarMenu === MENU_ELEMENT.CHAT}
          />
        )}
        {/* QUEUES */}
        {hasMacroPermission('queue_agent') && (
          <SidebarButton
            icon={QueuesMenuIcon}
            label={t('Queues.Queues')}
            hasNotification={false}
            onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.QUEUES)}
            isSelected={selectedSidebarMenu === MENU_ELEMENT.QUEUES}
          />
        )}
        {/* PARKED CALLS */}
        {hasPermission(PERMISSION.PARKINGS) && (
          <SidebarButton
            icon={ParkedCallMenuIcon}
            label={t('Parks.Parking')}
            hasNotification={(parkedCalls?.length || 0) > 0}
            hasPulseNotification={parkedPulse}
            onClick={() => {
              handleSidebarMenuSelection(MENU_ELEMENT.PARKED_CALLS)
              setParkedPulse(false)
            }}
            isSelected={selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS}
          />
        )}
        {/* APP UPDATE */}
        <SidebarButton
          icon={InfoMenuIcon}
          label={t('About.title')}
          hasNotification={!!notifications?.system?.update}
          hasPulseNotification={!isAboutVisited}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.ABOUT)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.ABOUT}
        />
      </div>
    </nav>
  )
}
