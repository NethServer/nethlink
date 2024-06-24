import { useState } from "react"
import { MissedCallsBox } from "./LastCallsBox"
import { AddToPhonebookBox } from "../PhonebookModule/AddToPhonebookBox"
import { usePhonebookModule } from "../PhonebookModule/hook/usePhonebookModule"

export const LastCallsModule = () => {

  const phonebookModule = usePhonebookModule()
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact
  const [isContactFormOpen, setContactFormOpen] = useState<boolean>(false)


  return (
    <>
      {!(isContactFormOpen) && <MissedCallsBox showContactForm={() => setContactFormOpen(true)} />}

      {isContactFormOpen && <AddToPhonebookBox
        close={() => {
          setSelectedContact(undefined)
          setContactFormOpen(false)
        }}
      />
      }
    </>
  )
}
