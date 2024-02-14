import { SidebarButton } from './SidebarButton'
import { faBolt, faPhone } from '@fortawesome/free-solid-svg-icons'

export enum MENU_ELEMENT {
  ZAP,
  PHONE
}

export interface SidebarProps {
  selectedMenu: MENU_ELEMENT
  setSelectedMenu: React.Dispatch<React.SetStateAction<MENU_ELEMENT>>
}

export function Sidebar({ selectedMenu, setSelectedMenu }: SidebarProps): JSX.Element {
  return (
    <div className="flex flex-col h-full w-full items-center gap-6 px-2 py-2 border border-t-0 border-r-0 border-b-0 border-gray-700">
      <SidebarButton
        icon={faBolt}
        focus={selectedMenu === MENU_ELEMENT.ZAP}
        hasNotification={true}
        onClick={() => setSelectedMenu(MENU_ELEMENT.ZAP)}
      />
      <SidebarButton
        icon={faPhone}
        focus={selectedMenu === MENU_ELEMENT.PHONE}
        hasNotification={false}
        onClick={() => setSelectedMenu(MENU_ELEMENT.PHONE)}
      />
    </div>
  )
}
