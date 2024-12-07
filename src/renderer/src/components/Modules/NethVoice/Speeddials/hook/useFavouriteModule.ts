import { useNethlinkData, useSharedState } from "@renderer/store"
import { ContactType, SearchData } from "@shared/types"
import { useEffect, useState } from "react"
import { debouncer } from "@shared/utils/utils"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { FilterTypes, SpeeddialTypes } from "@shared/constants"
export const useFavouriteModule = () => {
  const [speeddialsModule] = useNethlinkData('speeddialsModule')
  const [rawSpeedDials, setRawSpeedDials] = useSharedState('speeddials')
  const [operators] = useSharedState('operators')
  const [favourites, setFavourites] = useState<ContactType[] | undefined>(undefined)
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  useEffect(() => {
    rawSpeedDials && filterFavourites(rawSpeedDials, speeddialsModule?.favouriteOrder || FilterTypes.AZ)
  }, [rawSpeedDials, speeddialsModule?.favouriteOrder])

  const getSorter = (order: FilterTypes) => {
    let sorter: ((a: ContactType, b: ContactType) => number) | undefined = undefined
    switch (order) {
      case FilterTypes.ZA:
        sorter = (a: ContactType, b: ContactType) => (a.name || '') < (b.name || '') ? 1 : -1
        break;
      case FilterTypes.EXT:
        sorter = (a: ContactType, b: ContactType) => (a.speeddial_num || '') > (b.speeddial_num || '') ? 1 : -1
        break;
      default:
        sorter = (a: ContactType, b: ContactType) => (a.name || '') > (b.name || '') ? 1 : -1
        break;
    }
    return sorter
  }

  const filterFavourites = (rawSpeeddials: ContactType[], order: FilterTypes) => {
    const favourites = rawSpeeddials.filter(isFavourite).sort(getSorter(order))
    setFavourites(() => [...favourites])
  }

  const isFavourite = (contact: ContactType) => {
    return contact.notes?.includes(SpeeddialTypes.FAVOURITES)
  }

  const isSearchAlsoAFavourite = (contact: SearchData) => {
    const foundedContact = favourites?.find((s) => s.speeddial_num === contact.speeddial_num)
    if (foundedContact) {
      return isFavourite(foundedContact)
    }
    return false
  }

  function toggleFavourite(contact: ContactType) {
    debouncer(`toggleFavourite-${contact.id}`, async () => {
      const speedDial = favourites?.find((s) => s.id === contact.id)
      if (!speedDial) {
        //if I am creating a favourite it means that I am from speeddial. in speeddial the username is saved in name
        const username = contact.name
        const operator = username && operators?.operators[username]
        if (operator)
          await NethVoiceAPI.Phonebook.createFavourite(operator)
      } else {
        //if I am deleting favourite then I am in favourite, I can use the id directly
        await NethVoiceAPI.Phonebook.deleteSpeeddial({ id: `${speedDial.id!}` })
      }
      const updatedSpeedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
      setRawSpeedDials(() => updatedSpeedDials)
    }, 100)
  }

  function toggleFavouriteFromSearch(contact: SearchData) {
    debouncer(`toggleFavourite-${contact.id}`, async () => {
      const speedDial = favourites?.find((s) => s.speeddial_num === contact.speeddial_num)
      if (!speedDial) {
        //I am creating the favourite from the search so I find the username directly in searchData
        const username = contact.username
        const operator = username && operators?.operators[username]
        if (operator)
          await NethVoiceAPI.Phonebook.createFavourite(operator)
      } else {
        await NethVoiceAPI.Phonebook.deleteSpeeddial({ id: `${speedDial.id!}` })
      }
      const updatedSpeedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
      setRawSpeedDials(() => updatedSpeedDials)
    }, 100)
  }


  return {
    favourites,
    toggleFavourite,
    isFavourite,
    isSearchAlsoAFavourite,
    toggleFavouriteFromSearch
  }
}


