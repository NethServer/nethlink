import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useNethlinkData } from "@renderer/store"
import { ContactType, PhonebookModuleData, SelectedContact, StateType } from "@shared/types"

export const usePhonebookModule = (): {
  selectedContact: StateType<SelectedContact>,
  handleAddContactToPhonebook: (contact: ContactType) => Promise<ContactType>
} => {

  const [phonebookModule, setPhonebookModule] = useNethlinkData('phonebookModule')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const update = <T>(selector: keyof PhonebookModuleData) => (value: T | undefined) => {
    setPhonebookModule((p) => ({
      ...p,
      [selector]: value as any
    }))
  }

  const handleAddContactToPhonebook = async (contact: ContactType) => {
    const result: ContactType = await NethVoiceAPI.Phonebook.createContact(contact)
    return result
  }

  return {
    selectedContact: [phonebookModule?.selectedContact, update<SelectedContact>('selectedContact')] as StateType<SelectedContact>,
    handleAddContactToPhonebook
  }
}
