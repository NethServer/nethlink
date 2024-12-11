import { useEffect, useRef, useState } from 'react'
import {
  faBolt as SpeedDialMenuIcon,
  faPhone as MissedCallMenuIcon,
  faInfoCircle as InfoMenuIcon,
  faStar as FavouriteMenuIcon,
  faSquareParking as ParkedCallMenuIcon
} from '@fortawesome/free-solid-svg-icons'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { ParkingType } from '@shared/types'
import { MENU_ELEMENT, PERMISSION } from '@shared/constants'
import { useAccount } from '@renderer/hooks/useAccount'
import { difference } from 'lodash'
import { useParkingModule } from '../Parking/hook/useParkingModule'
import { SidebarButton } from '@renderer/components/SidebarButton'

export interface SidebarProps {
  onChangeMenu: (menuElement: MENU_ELEMENT) => void
}

export function Sidebar({ onChangeMenu }: SidebarProps): JSX.Element {

  const [selectedSidebarMenu, setSelectedSidebarMenu] = useNethlinkData('selectedSidebarMenu')
  const [, setShowPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [, setPhonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const [missedCalls] = useSharedState('missedCalls')
  const [notifications] = useSharedState('notifications')
  const [lastMenu, setLastMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.FAVOURITES)
  const [isAboutVisited, setIsAboutVisited] = useState<boolean>(false)


  const viewedParkedCalls = useRef<ParkingType[]>([])
  const [parkedPulse, setParkedPulse] = useState<boolean>(false)

  const { hasPermission } = useAccount()
  const { parkedCalls } = useParkingModule()

  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setSelectedSidebarMenu(menuElement)
    setShowPhonebookSearchModule(false)
    setPhonebookSearchModule({
      searchText: undefined
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


  useEffect(() => {
    if (selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS) {
      viewedParkedCalls.current = [...(parkedCalls || [])]
    }
    const currentNames = parkedCalls?.map((c) => c.parkedCaller.name) || []
    viewedParkedCalls.current = viewedParkedCalls.current.filter((p) => currentNames.includes(p.parkedCaller.name))
    const names = viewedParkedCalls.current.map((c) => c.parkedCaller.name)
    const diff = difference(currentNames, names)
    if (diff.length > 0) {
      setParkedPulse(true)
    }
  }, [parkedCalls, selectedSidebarMenu])

  return (
    <div className="flex flex-col h-full max-w-[50px] justify-between pt-3 pb-2 px-2 border-0 border-l-[1px] dark:border-borderDark border-borderLight">
      <div className="flex flex-col items-center gap-6">
        {/* FAVOURITE */}
        <SidebarButton
          icon={FavouriteMenuIcon}
          focus={selectedSidebarMenu === MENU_ELEMENT.FAVOURITES}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.FAVOURITES)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.FAVOURITES}
        />
        {/* SPEEDDIALS */}
        <SidebarButton
          icon={SpeedDialMenuIcon}
          focus={selectedSidebarMenu === MENU_ELEMENT.SPEEDDIALS}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.SPEEDDIALS)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.SPEEDDIALS}
        />
        {/* LAST CALLS */}
        <SidebarButton
          icon={MissedCallMenuIcon}
          focus={selectedSidebarMenu === MENU_ELEMENT.LAST_CALLS}
          hasNotification={!!missedCalls && missedCalls.length > 0}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.LAST_CALLS)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.LAST_CALLS}
        />
        {/* PARKED CALLS */}
        {
          hasPermission(PERMISSION.PARKINGS) && (
            <SidebarButton
              icon={ParkedCallMenuIcon}
              focus={selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS}
              hasNotification={(parkedCalls?.length || 0) > 0}
              hasPulseNotification={parkedPulse}
              onClick={() => {
                handleSidebarMenuSelection(MENU_ELEMENT.PARKED_CALLS)
                setParkedPulse(false)
              }}
              isSelected={selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS}
            />
          )
        }
        {/* APP UPDATE */}
        <SidebarButton
          icon={InfoMenuIcon}
          focus={selectedSidebarMenu === MENU_ELEMENT.ABOUT}
          hasNotification={!!notifications?.system?.update}
          hasPulseNotification={!isAboutVisited}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.ABOUT)}
          isSelected={selectedSidebarMenu === MENU_ELEMENT.ABOUT}
        />
      </div>
    </div>
  )
}

