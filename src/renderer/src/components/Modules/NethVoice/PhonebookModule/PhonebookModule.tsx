import { useState } from "react"
import { AddToPhonebookBox } from "./AddToPhonebookBox"
import { usePhonebookModule } from "./hook/usePhonebookModule"

export const PhonebookModule = () => {

  const phonebookModule = usePhonebookModule()
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact

  return (
    <>
      <AddToPhonebookBox
        close={() => {
          setSelectedContact(undefined)
        }}
      />
    </>
  )
}
