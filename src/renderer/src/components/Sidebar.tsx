import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { SidebarButton } from './SidebarButton'
import {
  faBolt as SpeedDialMenuIcon,
  faPhone as MissedCallMenuIcon,
  faInfoCircle as InfoMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { Notifications } from '@shared/types'

export enum MENU_ELEMENT {
  SPEEDDIALS,
  PHONE,
  ABOUT
}

export interface SidebarProps {
  selectedMenu: MENU_ELEMENT
  handleSidebarMenuSelection: (menuElement: MENU_ELEMENT) => void
}

export function Sidebar({ selectedMenu, handleSidebarMenuSelection }: SidebarProps): JSX.Element {

  const notifications = useSubscriber<Notifications>('notifications')

  return (
    <div className="flex flex-col h-full max-w-[50px] justify-between pt-3 pb-2 px-2 border-0 border-l-[1px] dark:border-borderDark border-borderLight">
      <div className="flex flex-col items-center gap-6">
        <SidebarButton
          icon={SpeedDialMenuIcon}
          focus={selectedMenu === MENU_ELEMENT.SPEEDDIALS}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.SPEEDDIALS)}
          className={`${selectedMenu === MENU_ELEMENT.SPEEDDIALS ? '' : 'dark:hover:bg-hoverDark hover:bg-hoverLight'}`}
        />
        <SidebarButton
          icon={MissedCallMenuIcon}
          focus={selectedMenu === MENU_ELEMENT.PHONE}
          hasNotification={false}
          onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.PHONE)}
          className={`${selectedMenu === MENU_ELEMENT.PHONE ? '' : 'dark:hover:bg-hoverDark hover:bg-hoverLight'}`}
        />
      </div>
      <SidebarButton
        icon={InfoMenuIcon}
        focus={selectedMenu === MENU_ELEMENT.ABOUT}
        hasNotification={!!notifications?.system?.update}
        onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.ABOUT)}
        className={`${selectedMenu === MENU_ELEMENT.ABOUT ? '' : 'dark:hover:bg-hoverDark hover:bg-hoverLight'}`}
      />
    </div>
  )
}
