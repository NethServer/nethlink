import { useStoreState } from "@renderer/store"
import { NethLinkPageData } from "@shared/types"
import { MENU_ELEMENT } from "@shared/constants"
import { useCallback, useEffect, useMemo } from "react"
import { PhonebookModule, SpeeddialsModule, LastCallsModule, PhoneBookSearchModule } from "."
import { usePhonebookSearchModule } from "./SearchResults/hook/usePhoneBookSearchModule"

export const NethLinkModules = () => {
  const phonebookSearchModule = usePhonebookSearchModule()
  const [searchText, setSearchText] = phonebookSearchModule.searchTextState
  const [nethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')

  useEffect(() => {
    setSearchText(null)
  }, [nethLinkPageData?.selectedSidebarMenu])

  const VisibleModule = useCallback(() => {

    if (nethLinkPageData?.showPhonebookSearchModule) return <PhoneBookSearchModule />
    if (nethLinkPageData?.showAddContactModule) return <PhonebookModule />

    switch (nethLinkPageData?.selectedSidebarMenu) {
      case MENU_ELEMENT.SPEEDDIALS:
        return <SpeeddialsModule />
      case MENU_ELEMENT.LAST_CALLS:
        return <LastCallsModule />
      default:
        <>modules</>
    }
  }, [nethLinkPageData?.showAddContactModule, nethLinkPageData?.showPhonebookSearchModule, nethLinkPageData?.selectedSidebarMenu])

  return (
    <div className="absolute top-0 left-0 z-[100] dark:bg-bgDark bg-bgLight h-full w-full rounded-bl-lg">
      <VisibleModule />
    </div>
  )

}
