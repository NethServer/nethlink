import { AddToPhonebookBox } from "./AddToPhonebookBox"
import { usePhonebookModule } from "./hook/usePhonebookModule"
import { useNethlinkData } from "@renderer/store"

export const PhonebookModule = () => {

  const phonebookModule = usePhonebookModule()
  const [phonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const [, setShowAddContactModule] = useNethlinkData('showAddContactModule')
  const [, setShowPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact

  return (
    <AddToPhonebookBox
      close={() => {
        setSelectedContact(undefined)
        setShowAddContactModule(false)
        //if i previously searched anything then i would return to the search page
        setShowPhonebookSearchModule(!!phonebookSearchModule)
      }}
    />
  )
}
