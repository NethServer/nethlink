import { debouncer } from "@shared/utils/utils"
import { SearchNumberBox } from "./SearchNumberBox"
import { useEffect, useState } from "react"
import { usePhonebookSearchModule } from "./hook/usePhoneBookSearchModule"
import { NethLinkPageData, SearchData } from "@shared/types"
import { log } from "@shared/utils/logger"
import { usePhonebookModule } from "../NethVoice/PhonebookModule/hook/usePhonebookModule"
import { useStoreState } from "@renderer/store"

export const PhoneBookSearchModule = () => {

  const phoneBookModule = usePhonebookSearchModule()
  const { searchPhonebookContacts } = phoneBookModule
  const [searchText] = phoneBookModule.searchTextState
  const [searchResult, setSearchResult] = useState<SearchData[]>()
  const [nethlinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')

  useEffect(() => {
    if ((searchText?.length || 0) >= 3) {
      debouncer(
        'search',
        async () => {
          const result = await searchPhonebookContacts()
          setSearchResult(() => result)
        },
        250
      )
    } else {
      setSearchResult(() => [])
    }
  }, [searchText])

  return (
    <>
      <SearchNumberBox searchResult={searchResult}
        showContactForm={() => setNethLinkPageData((p) => ({
          ...p,
          showPhonebookSearchModule: false,
          showAddContactModule: true
        }))} />
    </>
  )
}
