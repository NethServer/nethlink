import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { useStoreState } from "@renderer/store"
import { ContactType, NethLinkPageData, NewContactType, NewSpeedDialType, SpeedDialModuleData, StateType } from "@shared/types"
import { log } from "@shared/utils/logger"

export const useSpeedDialsModule = (): {
  speedDialsState: StateType<ContactType>,
  favouriteState: StateType<ContactType>,
  deleteSpeedDial: (speedDial: ContactType) => Promise<void>
  upsertSpeedDial(data: ContactType): Promise<void>
} => {
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [speedDials, setSpeedDials] = useStoreState<ContactType[]>('speeddials')
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

  const deleteSpeedDial = async (speedDial) => {
    try {
      const deletedSpeedDial = await NethVoiceAPI.Phonebook.deleteSpeeddial({
        id: `${speedDial.id}`
      })
      setSpeedDials((p) =>
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
      const selectedSpeedDial = nethLinkPageData?.speeddialsModule?.selectedSpeedDial
      if (selectedSpeedDial) {
        const updatedSpeedDial = await NethVoiceAPI.Phonebook.updateSpeeddial(speedDial, selectedSpeedDial)
        if (updatedSpeedDial) {
          const newSpeedDials = speedDials?.map((speedDial) =>
            speedDial.id?.toString() === updatedSpeedDial['id'] ? (updatedSpeedDial! as ContactType) : speedDial
          )
          setSpeedDials(() => newSpeedDials)
        }
      } else {
        const newSpeedDial = await NethVoiceAPI.Phonebook.createSpeeddial(speedDial)
        const speedDials = await NethVoiceAPI.Phonebook.getSpeeddials()
        setSpeedDials((p) => speedDials)
      }

    } catch (e) {
      throw new Error()
    }
  }

  return {
    speedDialsState: [nethLinkPageData?.speeddialsModule?.selectedSpeedDial, update<ContactType>('selectedSpeedDial')] as StateType<ContactType>,
    favouriteState: [nethLinkPageData?.speeddialsModule?.selectedFavourite, update<ContactType>('selectedFavourite')] as StateType<ContactType>,
    deleteSpeedDial,
    upsertSpeedDial,
  }
}
