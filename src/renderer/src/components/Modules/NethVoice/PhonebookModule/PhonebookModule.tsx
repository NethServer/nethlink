import { useEffect, useRef, useState } from "react"
import { AddToPhonebookBox } from "./AddToPhonebookBox"
import { usePhonebookModule } from "./hook/usePhonebookModule"
import { useStoreState } from "@renderer/store"
import { NethLinkPageData } from "@shared/types"
import { log } from "@shared/utils/logger"

export const PhonebookModule = () => {

  const phonebookModule = usePhonebookModule()
  const [nethlinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact

  return (
    <>
      <AddToPhonebookBox
        close={() => {
          setSelectedContact(undefined)
          setNethLinkPageData((p) => ({
            ...p,
            showPhonebookSearchModule: !!nethlinkPageData?.phonebookSearchModule, //if i previously searched anything then i would return to the search page
            showAddContactModule: false
          }))
        }}
      />
    </>
  )
}
