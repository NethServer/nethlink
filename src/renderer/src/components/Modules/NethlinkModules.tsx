import { useStoreState } from "@renderer/store"
import { NethLinkPageData } from "@shared/types"
import { MENU_ELEMENT } from "@shared/constants"
import { useCallback, useEffect, useMemo } from "react"
import { PhonebookModule, SpeeddialsModule, LastCallsModule, PhoneBookSearchModule } from "."
import { usePhonebookSearchModule } from "./SearchResults/hook/usePhoneBookSearchModule"
import { AboutModule } from "./About/AboutModule"
import classNames from "classnames"

export const NethLinkModules = () => {
  const phonebookSearchModule = usePhonebookSearchModule()
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
      case MENU_ELEMENT.ABOUT:
        return <AboutModule />
      default:
        <>modules</>
    }
  }, [nethLinkPageData?.showAddContactModule, nethLinkPageData?.showPhonebookSearchModule, nethLinkPageData?.selectedSidebarMenu])

  return (
    <div className={classNames(
      "z-[100] h-full w-full rounded-bl-lg "
      //dark:bg-bgDark bg-bgLight
    )}>
      <div className={classNames('h-[calc(100%-16px)] pt-1')}>
        <VisibleModule />
      </div>
    </div >
  )

}
