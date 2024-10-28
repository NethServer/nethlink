import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useStoreState } from "@renderer/store"
import { FilterTypes, SpeeddialTypes } from "@shared/constants"
import { ContactType, NethLinkPageData, NewContactType, NewSpeedDialType, SpeedDialModuleData, StateType } from "@shared/types"
import { log } from "@shared/utils/logger"
import { useEffect, useState } from "react"

export const useSpeedDialsModule = (): {
  speedDials: ContactType[] | undefined,
  speedDialsState: StateType<ContactType>,
  favouriteState: StateType<ContactType>,
  deleteSpeedDial: (speedDial: ContactType) => Promise<void>
  upsertSpeedDial(data: ContactType): Promise<void>
} => {
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [rawSpeedDials, setRawSpeedDials] = useStoreState<ContactType[]>('speeddials')
  const [speedDials, setSpeedDials] = useState<ContactType[] | undefined>(undefined)
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const update = <T>(selector: keyof SpeedDialModuleData) => (value: T | undefined) => {
    setNethLinkPageData((p) => ({
      ...p,
      speeddialsModule: {
        ...p?.speeddialsModule,
        [selector]: value as any
      }
    }))
  }

  useEffect(() => {
    log('UPDATE FAVOURITES', rawSpeedDials?.map((s) => ({ [`${s.id}`]: [s.name, s.notes] })))
    rawSpeedDials && filterSpeeddial(rawSpeedDials)
  }, [rawSpeedDials])

  const filterSpeeddial = (rawSpeeddials: ContactType[]) => {
    const speeddials = rawSpeeddials.filter(isSpeeddial)
    setSpeedDials(() => [...speeddials])
  }

  const isSpeeddial = (contact: ContactType) => {
    const speedDial = contact.speeddial_num ? rawSpeedDials?.find((s) => s.speeddial_num === contact.speeddial_num) : undefined
    if (speedDial) {
      return !speedDial.notes?.includes(SpeeddialTypes.FAVOURITES)
    }
    return false
  }


  const deleteSpeedDial = async (speedDial) => {
    try {
      const deletedSpeedDial = await NethVoiceAPI.Phonebook.deleteSpeeddial({
        id: `${speedDial.id}`
      })
      setRawSpeedDials((p) =>
        p?.filter(
          (s) => s.id?.toString() !== speedDial.id?.toString()
        )
      )
    } catch (e) {
      log(e)
      throw new Error()
    }
  }

  const upsertSpeedDial = async (speedDial: NewSpeedDialType | NewContactType) => {
    try {
      const selectedSpeedDial = nethLinkPageData?.speeddialsModule?.selectedSpeedDial
      if (selectedSpeedDial) {
        const updatedSpeedDial = await NethVoiceAPI.Phonebook.updateSpeeddial(speedDial, selectedSpeedDial)
        if (updatedSpeedDial) {
          const newSpeedDials = rawSpeedDials?.map((speedDial) =>
            speedDial.id?.toString() === updatedSpeedDial['id'] ? (updatedSpeedDial! as ContactType) : speedDial
          )
          setRawSpeedDials(() => newSpeedDials)
        }
      } else {
        const newSpeedDial = await NethVoiceAPI.Phonebook.createSpeeddial(speedDial)
        const newRawSpeedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
        setRawSpeedDials((p) => newRawSpeedDials)
      }

    } catch (e) {
      throw new Error()
    }
  }

  return {
    speedDials,
    speedDialsState: [nethLinkPageData?.speeddialsModule?.selectedSpeedDial, update<ContactType>('selectedSpeedDial')] as StateType<ContactType>,
    favouriteState: [nethLinkPageData?.speeddialsModule?.selectedFavourite, update<ContactType>('selectedFavourite')] as StateType<ContactType>,
    deleteSpeedDial,
    upsertSpeedDial,
  }
}
