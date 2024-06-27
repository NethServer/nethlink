import { debouncer } from "@shared/utils/utils"
import { SearchNumberBox } from "./SearchNumberBox"
import { useEffect, useState } from "react"
import { usePhonebookSearchModule } from "./hook/usePhoneBookSearchModule"
import { SearchData } from "@shared/types"
import { log } from "@shared/utils/logger"
import { AddToPhonebookBox } from "../NethVoice/PhonebookModule/AddToPhonebookBox"
import { usePhonebookModule } from "../NethVoice/PhonebookModule/hook/usePhonebookModule"

export const PhoneBookSearchModule = () => {

  const phoneBookModule = usePhonebookSearchModule()
  const { searchPhonebookContacts } = phoneBookModule
  const [searchText] = phoneBookModule.searchTextState
  const [searchResult, setSearchResult] = useState<SearchData[]>()

  const phonebookModule = usePhonebookModule()
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact
  const [isContactFormOpen, setContactFormOpen] = useState<boolean>(false)

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
      <SearchNumberBox searchResult={searchResult} showContactForm={() => setContactFormOpen(true)} />
      {
        isContactFormOpen && <AddToPhonebookBox
          close={() => {
            setSelectedContact(undefined)
            setContactFormOpen(false)
          }}
        />
      }
    </>
  )
}
