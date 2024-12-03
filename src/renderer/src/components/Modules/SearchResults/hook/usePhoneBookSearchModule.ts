import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useStoreState } from "@renderer/store"
import { NethLinkPageData, PhonebookSearchModuleData, SearchCallData, SearchData, StateType } from "@shared/types"
import { log } from "@shared/utils/logger"

export const usePhonebookSearchModule = (): {
  searchTextState: StateType<string | null>,
  searchPhonebookContacts: () => Promise<SearchData[]>
} => {
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const update = <T>(selector: keyof PhonebookSearchModuleData) => (value: T | undefined) => {
    setNethLinkPageData((p) => ({
      ...p,
      phonebookSearchModule: {
        ...p?.phonebookSearchModule,
        [selector]: value as any
      }
    }))
  }

  function mapContact(contact: SearchData) {
    // kind & display name
    if (contact.name) {
      contact.kind = 'person'
      contact.displayName = contact.name
    } else {
      contact.kind = 'company'
      contact.displayName = contact.company
    }

    // company contacts
    if (contact.contacts) {
      contact.contacts = JSON.parse(contact.contacts)
    }
    return contact
  }

  function prapareSearchData(receivedPhoneNumbers: SearchCallData) {
    receivedPhoneNumbers.rows = receivedPhoneNumbers.rows.map((contact: SearchData) => {
      return mapContact(contact)
    })
    const filteredNumbers = receivedPhoneNumbers.rows.filter(
      (phoneNumber) => !(!phoneNumber.name || phoneNumber.name === '')
    )
    return filteredNumbers
  }

  const searchPhonebookContacts = async () => {
    const searchResult: SearchCallData = await NethVoiceAPI.Phonebook.search(nethLinkPageData?.phonebookSearchModule?.searchText || '')
    return prapareSearchData(searchResult)
  }


  return {
    searchTextState: [nethLinkPageData?.phonebookSearchModule?.searchText, update<string | null>('searchText')] as StateType<string | null>,
    searchPhonebookContacts
  }
}
