import { useStoreState } from "@renderer/store"
import { ContactType, NewContactType, NewSpeedDialType } from "@shared/types"
import { useEffect, useState } from "react"
import { useSpeedDialsModule } from "./useSpeedDialsModule"
import { debouncer } from "@shared/utils/utils"
import { log } from "@shared/utils/logger"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { SpeeddialTypes } from "@shared/constants"
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

  function toggleFavourite(contact: ContactType, isSearch = false) {
    debouncer(`toggleFavourite-${contact.id}`, async () => {
      log('toggle ', contact)
      const notes = isFavourite(contact)
        ? contact.notes!.replace(SpeeddialTypes.FAVOURITES, SpeeddialTypes.CLASSIC)
        : contact.notes
          ? contact.notes?.includes(SpeeddialTypes.CLASSIC)
            ? contact.notes.replace(SpeeddialTypes.CLASSIC, SpeeddialTypes.FAVOURITES)
            : contact.notes?.concat(` ${SpeeddialTypes.FAVOURITES}`) || SpeeddialTypes.FAVOURITES
          : SpeeddialTypes.FAVOURITES
      const updatedContact: ContactType = convertSearchDataToContactType(contact, notes)
      if (!speedDials?.map((c) => c.id).includes(contact.id)) {
        log('Create new favourite', { updatedContact })
        await NethVoiceAPI.Phonebook.createSpeeddial(updatedContact as NewContactType)
      } else {
        log('UPDATE', { updatedContact })
        await NethVoiceAPI.Phonebook.updateSpeeddialBy(updatedContact)
      }
      const updatedSpeedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
      setSpeedDials(() => updatedSpeedDials)
    }, 100)
  }


  function convertSearchDataToContactType(searchData: any, notes: string): ContactType {
    return {
      id: searchData.id?.toString() || null,
      owner_id: searchData.owner_id || null,
      type: searchData.type || null,
      homeemail: searchData.homeemail || null,
      workemail: searchData.workemail || null,
      homephone: searchData.homephone || null,
      workphone: searchData.workphone || null,
      cellphone: searchData.cellphone || null,
      fax: searchData.fax || null,
      title: searchData.title || null,
      company: searchData.company || null,
      name: searchData.name || null,
      homestreet: searchData.homestreet || null,
      homepob: searchData.homepob || null,
      homecity: searchData.homecity || null,
      homeprovince: searchData.homeprovince || null,
      homepostalcode: searchData.homepostalcode || null,
      homecountry: searchData.homecountry || null,
      workstreet: searchData.workstreet || null,
      workpob: searchData.workpob || null,
      workcity: searchData.workcity || null,
      workprovince: searchData.workprovince || null,
      workpostalcode: searchData.workpostalcode || null,
      workcountry: searchData.workcountry || null,
      url: searchData.url || null,
      extension: searchData.extension || null,
      speeddial_num: searchData.speeddial_num || null,
      source: searchData.source || null,
      privacy: searchData.privacy || null,
      favorite: searchData.favorite,
      selectedPrefNum: searchData.selectedPrefNum || null,
      notes: notes,
    };
  }


  return {
    favourites,
    toggleFavourite,
    isFavourite
  }
}


