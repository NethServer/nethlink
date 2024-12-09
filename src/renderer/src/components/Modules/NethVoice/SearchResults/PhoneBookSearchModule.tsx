import { debouncer } from "@shared/utils/utils"
import { SearchNumberBox } from "./SearchNumberBox"
import { useEffect, useState } from "react"
import { usePhonebookSearchModule } from "./hook/usePhoneBookSearchModule"
import { SearchData } from "@shared/types"
import { useNethlinkData } from "@renderer/store"

export const PhoneBookSearchModule = () => {

  const phoneBookModule = usePhonebookSearchModule()
  const { searchPhonebookContacts } = phoneBookModule
  const [searchText] = phoneBookModule.searchTextState
  const [searchResult, setSearchResult] = useState<SearchData[]>()
  const [, setShowPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [, setShowAddContactModule] = useNethlinkData('showAddContactModule')

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
        showContactForm={() => {
          setShowAddContactModule(true)
          setShowPhonebookSearchModule(false)
        }}
      />
    </>
  )
}
