import { useEffect, useRef, useState } from 'react'
import { SidebarButton } from './SidebarButton'
import {
  faBolt as SpeedDialMenuIcon,
  faPhone as MissedCallMenuIcon,
  faInfoCircle as InfoMenuIcon,
  faSquareParking as ParkedCallMenuIcon
} from '@fortawesome/free-solid-svg-icons'
import { useStoreState } from '@renderer/store'
import { CallData, NethLinkPageData, NotificationData, ParkingType } from '@shared/types'
import { MENU_ELEMENT, PERMISSION } from '@shared/constants'
import { useAccount } from '@renderer/hooks/useAccount'

export interface SidebarProps {
  onChangeMenu: (menuElement: MENU_ELEMENT) => void
}

export function Sidebar({ onChangeMenu }: SidebarProps): JSX.Element {

  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [missedCalls] = useStoreState<CallData[]>('missedCalls')
  const [parkedCalls] = useStoreState<ParkingType[]>('parkings')
  const [notifications] = useStoreState<NotificationData>('notifications')
  const { hasPermission } = useAccount()
  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setNethLinkPageData((p) => ({
      ...p,
      selectedSidebarMenu: menuElement,
      showPhonebookSearchModule: false,
      phonebookSearchModule: {
        searchText: undefined
      }
    }))
  }

  useEffect(() => {
    if (nethLinkPageData && nethLinkPageData.selectedSidebarMenu) {
      onChangeMenu(nethLinkPageData.selectedSidebarMenu)
    }
  }, [nethLinkPageData?.selectedSidebarMenu])

  return (
    <div className="flex flex-col h-full max-w-[50px] justify-between pt-3 pb-2 px-2 border-0 border-l-[1px] dark:border-borderDark border-borderLight">
      <div className="flex flex-col items-center gap-6">
        {/* SPEEDDIALS */}
        <SidebarButton
          icon={SpeedDialMenuIcon}
          focus={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.SPEEDDIALS}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.SPEEDDIALS)}
          isSelected={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.SPEEDDIALS}
        />
        {/* LAST CALLS */}
        <SidebarButton
          icon={MissedCallMenuIcon}
          focus={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.LAST_CALLS}
          hasNotification={!!missedCalls && missedCalls.length > 0}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.LAST_CALLS)}
          isSelected={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.LAST_CALLS}
        />
        {/* PARKED CALLS */}
        {
          hasPermission(PERMISSION.PARKINGS) && (
            <SidebarButton
              icon={ParkedCallMenuIcon}
              focus={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS}
              hasNotification={false}
              onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.PARKED_CALLS)}
              isSelected={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.PARKED_CALLS}
            />
          )
        }
        {/* APP UPDATE */}
        <SidebarButton
          icon={InfoMenuIcon}
          focus={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.ABOUT}
          hasNotification={!!notifications?.system?.update}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.ABOUT)}
          isSelected={nethLinkPageData?.selectedSidebarMenu === MENU_ELEMENT.ABOUT}
        />
      </div>
      <>
      </>
    </div>
  )
}

