import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useNethlinkData } from "@renderer/store"
import { PhonebookSearchModuleData, SearchCallData, SearchData, StateType } from "@shared/types"

export const usePhonebookSearchModule = (): {
  searchTextState: StateType<string | null>,
  searchPhonebookContacts: () => Promise<SearchData[]>
} => {
  const [phonebookSearchModule, setPhonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const update = <T>(selector: keyof PhonebookSearchModuleData) => (value: T | undefined) => {
    setPhonebookSearchModule((p) => ({
      ...p,
      [selector]: value as any
    }))
  }

  function mapContact(contact: SearchData) {
    // kind & display name
     if (contact?.name && contact?.name !== '-') {
      contact.kind = 'person'
      contact.displayName = contact?.name
    } else {
      contact.kind = 'company'
      contact.displayName = contact?.company
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
      (phoneNumber) => !(!phoneNumber?.displayName || phoneNumber?.displayName === '')
    )
    return filteredNumbers
  }

  const searchPhonebookContacts = async () => {
    const searchResult: SearchCallData = await NethVoiceAPI.Phonebook.search(phonebookSearchModule?.searchText || '')
    return prapareSearchData(searchResult)
  }


  return {
    searchTextState: [phonebookSearchModule?.searchText, update<string | null>('searchText')] as StateType<string | null>,
    searchPhonebookContacts
  }
}
