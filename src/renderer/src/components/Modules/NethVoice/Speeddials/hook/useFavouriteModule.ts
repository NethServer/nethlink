import { useStoreState } from "@renderer/store"
import { ContactType, NethLinkPageData, NewContactType, OperatorData, SearchData } from "@shared/types"
import { useEffect, useState } from "react"
import { useSpeedDialsModule } from "./useSpeedDialsModule"
import { debouncer } from "@shared/utils/utils"
import { log } from "@shared/utils/logger"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { FilterTypes, SpeeddialTypes } from "@shared/constants"
export const useFavouriteModule = () => {
  const [nethLinkData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [rawSpeedDials, setRawSpeedDials] = useStoreState<ContactType[]>('speeddials')
  const [operators] = useStoreState<OperatorData>('operators')
  const [favourites, setFavourites] = useState<ContactType[] | undefined>(undefined)
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  useEffect(() => {
    log('UPDATE FAVOURITES', rawSpeedDials?.map((s) => ({ [`${s.id}`]: [s.name, s.notes] })))
    rawSpeedDials && filterFavourites(rawSpeedDials, nethLinkData?.speeddialsModule?.favouriteOrder || FilterTypes.AZ)
  }, [rawSpeedDials, nethLinkData?.speeddialsModule?.favouriteOrder])

  const getSorter = (order: FilterTypes) => {
    let sorter: ((a: ContactType, b: ContactType) => number) | undefined = undefined
    log({ order })
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
    const speedDial = contact.speeddial_num ? rawSpeedDials?.find((s) => s.speeddial_num === contact.speeddial_num) : undefined
    if (speedDial) {
      return speedDial.notes?.includes(SpeeddialTypes.FAVOURITES)
    }
    return false
  }

  function toggleFavourite(contact: any) {
    debouncer(`toggleFavourite-${contact.id}`, async () => {
      log('toggle ', contact)
      const speedDial = contact.speeddial_num ? rawSpeedDials?.find((s) => s.speeddial_num === contact.speeddial_num) : undefined
      if (!speedDial) {
        const username = contact.username
        const operator = username && operators?.operators[username]
        log({ operator })
        if (operator)
          await NethVoiceAPI.Phonebook.createFavourite(operator)
      } else {
        if (speedDial.notes?.includes(SpeeddialTypes.FAVOURITES)) {
          await NethVoiceAPI.Phonebook.deleteSpeeddial({ id: `${speedDial.id!}` })
        } else {
          await NethVoiceAPI.Phonebook.deleteSpeeddial({ id: `${speedDial.id!}` })
          let username: string | undefined = operators?.operators && Object.values(operators.operators).find((o) => o.endpoints.mainextension[0].id == contact.speeddial_num)?.username
          const operator = username && operators?.operators[username]
          log({ operator })
          if (operator)
            await NethVoiceAPI.Phonebook.createFavourite(operator)

        }
      }
      const updatedSpeedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
      setRawSpeedDials(() => updatedSpeedDials)
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
    isFavourite,
  }
}


