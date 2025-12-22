import classNames from 'classnames'
import { useFavouriteModule } from '../Speeddials/hook/useFavouriteModule'
import { ContactType, SearchData } from '@shared/types'
import { faStar as FavouriteIcon } from '@fortawesome/free-solid-svg-icons'
import { faStar as UnfavouriteIcon } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const FavouriteStar = ({
  contact,
  isSearchData,
}: {
  contact: ContactType | SearchData
  isSearchData: boolean
}) => {
  const {
    isSpeedDialAlsoAFavourite,
    isSearchAlsoAFavourite,
    toggleFavourite,
    toggleFavouriteFromSearch,
  } = useFavouriteModule()
  const isContactFavourite = isSearchData
    ? isSearchAlsoAFavourite(contact as SearchData)
    : isSpeedDialAlsoAFavourite(contact as ContactType)

  return (
    <FontAwesomeIcon
      className={classNames(
        'text-base cursor-pointer',
        isContactFavourite
          ? 'dark:text-textBlueDark text-textBlueLight'
          : 'dark:text-gray-400 text-gray-600 hover:dark:text-textBlueDark hover:text-textBlueLight',
      )}
      icon={isContactFavourite ? FavouriteIcon : UnfavouriteIcon}
      onClick={() =>
        isSearchData
          ? toggleFavouriteFromSearch(contact as SearchData)
          : toggleFavourite(contact as ContactType)
      }
    />
  )
}
