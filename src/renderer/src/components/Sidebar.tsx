import { SidebarButton } from './SidebarButton'
import { faBolt, faPhone } from '@fortawesome/free-solid-svg-icons'

export enum MENU_ELEMENT {
  SPEEDDIALS,
  PHONE
}

export interface SidebarProps {
  selectedMenu: MENU_ELEMENT
  handleSidebarMenuSelection: (menuElement: MENU_ELEMENT) => void
}

export function Sidebar({ selectedMenu, handleSidebarMenuSelection }: SidebarProps): JSX.Element {
  return (
    <div className="flex flex-col h-full max-w-[50px] items-center gap-6 px-2 py-2 border border-t-0 border-r-0 border-b-0 dark:border-gray-700 border-gray-200">
      <SidebarButton
        icon={faBolt}
        focus={selectedMenu === MENU_ELEMENT.SPEEDDIALS}
        hasNotification={true}
        onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.SPEEDDIALS)}
      />
      <SidebarButton
        icon={faPhone}
        focus={selectedMenu === MENU_ELEMENT.PHONE}
        hasNotification={false}
        onClick={() => handleSidebarMenuSelection(MENU_ELEMENT.PHONE)}
      />
    </div>
  )
}
