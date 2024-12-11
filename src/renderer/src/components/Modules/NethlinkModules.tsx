import { useNethlinkData, useSharedState } from "@renderer/store"
import { MENU_ELEMENT } from "@shared/constants"
import { useCallback, useEffect } from "react"
import { PhonebookModule, SpeeddialsModule, LastCallsModule } from "."
import { AboutModule } from "./NethVoice/About/AboutModule"
import classNames from "classnames"
import { FavouritesModule } from "./NethVoice/Speeddials/Favourites/FavouritesModule"
import { ParkingModule } from "./NethVoice/Parking/ParkingModule"
import { PhoneBookSearchModule } from "./NethVoice/SearchResults/PhoneBookSearchModule"
import { usePhonebookSearchModule } from "./NethVoice/SearchResults/hook/usePhoneBookSearchModule"

export const NethLinkModules = () => {
  const phonebookSearchModule = usePhonebookSearchModule()
  const [, setSearchText] = phonebookSearchModule.searchTextState
  const [showAddContactModule, setShowAddContactModule] = useNethlinkData('showAddContactModule')
  const [showPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [selectedSidebarMenu] = useNethlinkData('selectedSidebarMenu')

  useEffect(() => {
    setSearchText(null)
    if (showAddContactModule) {
      setShowAddContactModule(false)
    }
  }, [selectedSidebarMenu])

  const VisibleModule = useCallback(() => {

    if (showAddContactModule) return <PhonebookModule />
    if (showPhonebookSearchModule) return <PhoneBookSearchModule />

    switch (selectedSidebarMenu) {
      case MENU_ELEMENT.FAVOURITES:
        return <FavouritesModule />
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
  }, [showAddContactModule, showPhonebookSearchModule, selectedSidebarMenu])

  return (
    <div className={classNames(
      "relative h-full w-full ",
      'max-h-[calc(100vh-64px)]',
      'max-w-[calc(100vw-64px)]'
    )}>
      <div className={classNames('h-full  pt-0')}>
        <VisibleModule />
      </div>
    </div >
  )

}
