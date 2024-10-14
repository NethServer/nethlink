import { useStoreState } from "@renderer/store"
import { ContactType } from "@shared/types"
import { useEffect, useState } from "react"

export const useFavouriteModule = () => {

  const [speeddials] = useStoreState<ContactType[]>('speeddials')
  const [favourites, setFavourites] = useState<ContactType[] | undefined>(undefined)
  useEffect(() => {
    speeddials && filterFavourites(speeddials)
  }, [speeddials])

  const filterFavourites = (rawSpeeddials: ContactType[]) => {
    const favourites = rawSpeeddials.filter((c) => c.notes?.includes('speeddial-favorite'))
    setFavourites(() => [...favourites])
  }

  return {
    favourites,
  }
}
