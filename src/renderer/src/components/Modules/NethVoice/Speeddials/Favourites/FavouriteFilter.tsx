import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import classNames from 'classnames'
import { useTheme } from '@renderer/theme/Context'
import {
  faCheck as CheckedIcon,
  faChevronDown as ArrowMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { useNethlinkData } from '@renderer/store'
import { FilterTypes } from '@shared/constants'

export const FavouriteFilter = () => {
  const { theme: nethTheme } = useTheme()
  const [speeddialsModule, setSpeeddialsModule] =
    useNethlinkData('speeddialsModule')

  const setFilter = (type: FilterTypes) => {
    setSpeeddialsModule((p) => ({
      ...p,
      favouriteOrder: type,
    }))
  }

  const RenderMenuItem = ({ type }: { type: FilterTypes }) => {
    const isSelected = speeddialsModule?.favouriteOrder === type
    return (
      <MenuItem>
        <button
          type='button'
          role='menuitemradio'
          aria-checked={isSelected}
          className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-titleLight data-[focus]:bg-hoverLight dark:text-titleDark dark:data-[focus]:bg-hoverDark'
          onClick={() => setFilter(type)}
        >
          <FontAwesomeIcon
            className={classNames('size-4', isSelected ? '' : 'invisible')}
            icon={CheckedIcon}
            aria-hidden='true'
          />
          {t(`SpeedDial.${type}`)}
        </button>
      </MenuItem>
    )
  }

  return (
    <Menu>
      <MenuButton
        className={classNames(
          '-mr-2.5 gap-2 px-2.5 py-1.5',
          nethTheme.button.base,
          nethTheme.button.tertiary,
          nethTheme.button.rounded.base,
        )}
      >
        {t(`SpeedDial.${speeddialsModule?.favouriteOrder} label`)}
        <FontAwesomeIcon
          className='size-3'
          icon={ArrowMenuIcon}
          aria-hidden='true'
        />
      </MenuButton>
      <MenuItems
        anchor='bottom end'
        className='z-[110] min-w-48 rounded-lg border border-borderLight bg-white py-1 shadow-lg focus:outline-none dark:border-borderDark dark:bg-gray-950'
      >
        <div className='px-4 pb-1 pt-2 text-xs font-medium text-gray-600 dark:text-gray-400'>
          {t('SpeedDial.Order by')}
        </div>
        <RenderMenuItem type={FilterTypes.AZ} />
        <RenderMenuItem type={FilterTypes.ZA} />
        <RenderMenuItem type={FilterTypes.EXT} />
      </MenuItems>
    </Menu>
  )
}
