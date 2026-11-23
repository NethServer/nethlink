import classNames from 'classnames'
import { useId } from 'react'
import { t } from 'i18next'
import { useFavouriteModule } from '../Speeddials/hook/useFavouriteModule'
import { ContactType, SearchData } from '@shared/types'
import { faStar as FavouriteIcon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

export const FavouriteStar = ({
  contact,
  isSearchData,
}: {
  contact: ContactType | SearchData
  isSearchData: boolean
}) => {
  const tooltipId = useId()
  const {
    isSpeedDialAlsoAFavourite,
    isSearchAlsoAFavourite,
    toggleFavourite,
    toggleFavouriteFromSearch,
  } = useFavouriteModule()
  const isContactFavourite = isSearchData
    ? isSearchAlsoAFavourite(contact as SearchData)
    : isSpeedDialAlsoAFavourite(contact as ContactType)
  const label = t(
    isContactFavourite
      ? 'Common.Remove from favorites'
      : 'Common.Add to favorites',
  ) as string

  return (
    <>
      <button
        type='button'
        aria-pressed={isContactFavourite}
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        className='flex shrink-0 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
        onClick={() =>
          isSearchData
            ? toggleFavouriteFromSearch(contact as SearchData)
            : toggleFavourite(contact as ContactType)
        }
      >
        <FontAwesomeIcon
          className={classNames(
            'size-4',
            isContactFavourite
              ? 'text-indigo-700 dark:text-indigo-400'
              : 'text-gray-400 hover:text-indigo-700 dark:text-gray-500 dark:hover:text-indigo-400',
          )}
          icon={FavouriteIcon}
          aria-hidden='true'
        />
      </button>
      <CustomThemedTooltip id={tooltipId} place='top' />
    </>
  )
}
