import { useStoreState } from "@renderer/store"
import { Account, NethLinkPageData } from "@shared/types"
import { MENU_ELEMENT } from "@shared/constants"
import { useCallback, useEffect, useMemo } from "react"
import { PhonebookModule, SpeeddialsModule, LastCallsModule, PhoneBookSearchModule } from "."
import { usePhonebookSearchModule } from "./SearchResults/hook/usePhoneBookSearchModule"
import { AboutModule } from "./About/AboutModule"
import classNames from "classnames"
import { PresenceBadge, PresenceBadgeVisibility } from "./NethVoice/Presence/PresenceBadge"
import { ParkingModule } from "./NethVoice/Parking/ParkingModule"

export const NethLinkModules = () => {
  const phonebookSearchModule = usePhonebookSearchModule()
  const [account] = useStoreState<Account | undefined>('account')
  const [searchText, setSearchText] = phonebookSearchModule.searchTextState
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')

  useEffect(() => {
    setSearchText(null)
    if (nethLinkPageData?.showAddContactModule) {
      setNethLinkPageData((p) => ({
        ...p,
        showAddContactModule: false
      }))
    }
  }, [nethLinkPageData?.selectedSidebarMenu])

  const VisibleModule = useCallback(() => {

    if (nethLinkPageData?.showAddContactModule) return <PhonebookModule />
    if (nethLinkPageData?.showPhonebookSearchModule) return <PhoneBookSearchModule />

    switch (nethLinkPageData?.selectedSidebarMenu) {
      case MENU_ELEMENT.SPEEDDIALS:
        return <SpeeddialsModule />
      case MENU_ELEMENT.LAST_CALLS:
        return <LastCallsModule />
      case MENU_ELEMENT.PARKED_CALLS:
        return <ParkingModule />
      case MENU_ELEMENT.ABOUT:
        return <AboutModule />
      default:
        <>modules</>
    }
  }, [nethLinkPageData?.showAddContactModule, nethLinkPageData?.showPhonebookSearchModule, nethLinkPageData?.selectedSidebarMenu])

  return (
    <div className={classNames(
      " h-full w-full ",
      'max-h-[calc(100vh-64px)]',
    )}>
      <div className={classNames('h-full  pt-0')}>
        <VisibleModule />
      </div>
    </div >
  )

}
