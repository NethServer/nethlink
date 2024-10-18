import { useStoreState } from "@renderer/store"
import { ContactType, NewSpeedDialType } from "@shared/types"
import { useEffect, useState } from "react"
import { useSpeedDialsModule } from "./useSpeedDialsModule"
import { debouncer } from "@shared/utils/utils"
import { log } from "@shared/utils/logger"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"


export enum SpeeddialTypes {
  CLASSIC = 'speeddial-classic',
  FAVOURITES = 'speeddial-favorite'
}
export const useFavouriteModule = () => {

  const [speedDials, setSpeedDials] = useStoreState<ContactType[]>('speeddials')
  const [favourites, setFavourites] = useState<ContactType[] | undefined>(undefined)
  const { upsertSpeedDial } = useSpeedDialsModule()
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  useEffect(() => {
    log('UPDATE FAVOURITES', speedDials?.map((s) => ({ [`${s.id}`]: [s.name, s.notes] })))
    speedDials && filterFavourites(speedDials)
  }, [speedDials])

  const filterFavourites = (rawSpeeddials: ContactType[]) => {
    const favourites = rawSpeeddials.filter(isFavourite)
    setFavourites(() => [...favourites])
  }

  const isFavourite = (contact: ContactType) => {
    return contact.notes?.includes(SpeeddialTypes.FAVOURITES)
  }

  function toggleFavourite(contact: ContactType) {
    debouncer(`toggleFavourite-${contact.id}`, async () => {
      log('toggle ', contact)
      const notes = isFavourite(contact)
        ? contact.notes!.replace(SpeeddialTypes.FAVOURITES, SpeeddialTypes.CLASSIC)
        : contact.notes?.includes(SpeeddialTypes.CLASSIC)
          ? contact.notes.replace(SpeeddialTypes.CLASSIC, SpeeddialTypes.FAVOURITES)
          : contact.notes?.concat(` ${SpeeddialTypes.FAVOURITES}`) || SpeeddialTypes.FAVOURITES
      const updatedContact: ContactType = Object.assign({}, {
        ...contact,
        notes
      })
      await NethVoiceAPI.Phonebook.updateSpeeddialBy(updatedContact)
      const speedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
      setSpeedDials((p) => speedDials)
    }, 100)
  }




  return {
    favourites,
    toggleFavourite,
    isFavourite
  }
}
