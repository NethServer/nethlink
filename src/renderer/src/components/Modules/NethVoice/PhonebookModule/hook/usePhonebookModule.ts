import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useStoreState } from "@renderer/store"
import { ContactType, NethLinkPageData, PhonebookModuleData, SelectedContact, StateType } from "@shared/types"

export const usePhonebookModule = (): {
  selectedContact: StateType<SelectedContact>,
  handleAddContactToPhonebook: (contact: ContactType) => Promise<ContactType>
} => {

  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const update = <T>(selector: keyof PhonebookModuleData) => (value: T | undefined) => {
    setNethLinkPageData((p) => ({
      ...p,
      phonebookModule: {
        ...p?.phonebookModule,
        [selector]: value as any
      }
    }))
  }

  const handleAddContactToPhonebook = async (contact: ContactType) => {
    const result: ContactType = await NethVoiceAPI.Phonebook.createContact(contact)
    return result
  }

  return {
    selectedContact: [nethLinkPageData?.phonebookModule?.selectedContact, update<SelectedContact>('selectedContact')] as StateType<SelectedContact>,
    handleAddContactToPhonebook
  }
}
