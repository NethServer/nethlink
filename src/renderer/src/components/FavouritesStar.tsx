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
import { log } from "@shared/utils/logger"
import { debouncer } from "@shared/utils/utils"
import { useCallback, useRef } from "react"
import { usePhoneIslandEventHandler } from "@renderer/hooks/usePhoneIslandEventHandler"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"

export const FavouriteStar = ({ contact }: { contact: ContactType }) => {
  const { isFavourite, toggleFavourite } = useFavouriteModule()
  const isContactFavourite = isFavourite(contact)

  return (
    <FontAwesomeIcon
      className={classNames("text-base cursor-pointer", isContactFavourite ? 'dark:text-textBlueDark text-textBlueLight' : 'dark:text-gray-400 text-gray-600 hover:dark:text-textBlueDark hover:text-textBlueLight')}
      icon={isContactFavourite ? FavouriteIcon : UnfavouriteIcon}
      onClick={() => toggleFavourite(contact)}
    />
  )

}
