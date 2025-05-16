import { debouncer } from "@shared/utils/utils"
import { SearchNumberBox } from "./SearchNumberBox"
import { useEffect, useState } from "react"
import { usePhonebookSearchModule } from "./hook/usePhoneBookSearchModule"
import { SearchData } from "@shared/types"
import { useNethlinkData } from "@renderer/store"
import { SearchNumberDetail } from "./SearchNumberDetail"
import classNames from "classnames"

export const PhoneBookSearchModule = () => {

  const phoneBookModule = usePhonebookSearchModule()
  const { searchPhonebookContacts } = phoneBookModule
  const [searchText] = phoneBookModule.searchTextState
  const [searchResult, setSearchResult] = useState<SearchData[]>()
  const [, setShowPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [, setShowAddContactModule] = useNethlinkData('showAddContactModule')
  const [contactDetail, setContactDetail] = useState<{
    contact: SearchData,
    primaryNumber: string | null
  }>()

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
      <SearchNumberBox
        className={classNames(contactDetail ? 'hidden' : 'visible')}
        searchResult={searchResult}
        showContactForm={() => {
          setShowAddContactModule(true)
          setShowPhonebookSearchModule(false)
        }}
        showContactDetail={(contact, primaryNumber) => {
          setShowAddContactModule(false)
          setContactDetail(() => ({ contact, primaryNumber }))
        }}
      />
      <SearchNumberDetail contactDetail={contactDetail} onBack={() => {
        setContactDetail(() => undefined)
      }} />
    </>
  )
}
