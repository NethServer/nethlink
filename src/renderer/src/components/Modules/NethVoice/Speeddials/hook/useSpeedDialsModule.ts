import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useNethlinkData, useSharedState } from "@renderer/store"
import { SpeeddialTypes } from "@shared/constants"
import { ContactType, NewContactType, NewSpeedDialType, SpeedDialModuleData, StateType } from "@shared/types"
import { useEffect, useState } from "react"

export const useSpeedDialsModule = (): {
  speedDials: ContactType[] | undefined,
  speedDialsState: StateType<ContactType>,
  favouriteState: StateType<ContactType>,
  deleteSpeedDial: (speedDial: ContactType) => Promise<void>
  upsertSpeedDial(data: ContactType): Promise<void>
} => {
  const [speeddialsModule, setSpeeddialsModule] = useNethlinkData('speeddialsModule')
  const [rawSpeedDials, setRawSpeedDials] = useNethlinkData('speeddials')
  const [speedDials, setSpeedDials] = useState<ContactType[] | undefined>(undefined)
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const update = <T>(selector: keyof SpeedDialModuleData) => (value: T | undefined) => {
    setSpeeddialsModule((p) => ({
      ...p,
      [selector]: value as any
    }))
  }

  useEffect(() => {
    rawSpeedDials && filterSpeeddial(rawSpeedDials)
  }, [rawSpeedDials])

  const filterSpeeddial = (rawSpeeddials: ContactType[]) => {
    const speeddials = rawSpeeddials.filter(isSpeeddial)
    setSpeedDials(() => [...speeddials])
  }

  const isSpeeddial = (contact: ContactType) => {
    return contact.notes?.includes(SpeeddialTypes.BASIC)
  }


  const deleteSpeedDial = async (speedDial) => {
    try {
      await NethVoiceAPI.Phonebook.deleteSpeeddial({
        id: `${speedDial.id}`
      })
      setRawSpeedDials((p) =>
        p?.filter(
          (s) => s.id?.toString() !== speedDial.id?.toString()
        )
      )
    } catch (e) {
      throw new Error()
    }
  }

  const upsertSpeedDial = async (speedDial: NewSpeedDialType | NewContactType) => {
    try {
      const selectedSpeedDial = speeddialsModule?.selectedSpeedDial
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
    speedDialsState: [speeddialsModule?.selectedSpeedDial, update<ContactType>('selectedSpeedDial')] as StateType<ContactType>,
    favouriteState: [speeddialsModule?.selectedFavourite, update<ContactType>('selectedFavourite')] as StateType<ContactType>,
    deleteSpeedDial,
    upsertSpeedDial,
  }
}
