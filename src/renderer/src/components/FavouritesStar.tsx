import classNames from "classnames"
import { useFavouriteModule } from "./Modules/NethVoice/Speeddials/hook/useFavouriteModule"
import { ContactType } from "@shared/types"
import {
  faStar as FavouriteIcon,
} from '@fortawesome/free-solid-svg-icons'
import {
  faStar as UnfavouriteIcon
} from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export const FavouriteStar = ({ contact }: { contact: ContactType }) => {
  const { isFavourite, toggleFavourite } = useFavouriteModule()
  return (
    <FontAwesomeIcon
      className={classNames("text-base cursor-pointer", isFavourite(contact) ? 'dark:text-textBlueDark text-textBlueLight hover:' : 'dark:text-gray-400 text-gray-600')}
      icon={isFavourite(contact) ? FavouriteIcon : UnfavouriteIcon}
      onClick={() => toggleFavourite(contact)}
    />
  )

}
