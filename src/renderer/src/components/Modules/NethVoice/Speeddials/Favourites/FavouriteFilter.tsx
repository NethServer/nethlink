import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Menu } from "@headlessui/react"
import classNames from "classnames"
import { useTheme } from "@renderer/theme/Context"
import {
  faCheck as CheckedIcon,
  faSortDown as ArrowMenuIcon
} from '@fortawesome/free-solid-svg-icons'
import { t } from "i18next"
import { useNethlinkData } from "@renderer/store"
import { FilterTypes } from "@shared/constants"
import { NethLinkPageData } from "@shared/types"

export const FavouriteFilter = () => {
  const { theme: nethTheme } = useTheme()
  const [speeddialsModule, setSpeeddialsModule] = useNethlinkData('speeddialsModule')

  const setFilter = (type: FilterTypes) => {
    setSpeeddialsModule((p) => ({
      ...p,
      favouriteOrder: type
    }))
  }



  const RenderMenuItem = ({ type }: { type: FilterTypes }) => {
    return <Menu.Item as={'div'} className="cursor-pointer">
      <div
        className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-hoverDark hover:bg-hoverLight mt-2"
        onClick={() => {
          setFilter(type)
        }}
      >
        <div className="flex gap-3 items-center">
          <FontAwesomeIcon
            className={classNames(speeddialsModule?.favouriteOrder === type ? '' : 'invisible', "text-base dark:text-titleDark text-titleLight min-w-5")}
            icon={CheckedIcon}
          />
          <p className="font-normal text-[14px] leading-5 dark:text-titleDark text-titleLight">
            {t(`SpeedDial.${type}`)}
          </p>
        </div>
      </div>
    </Menu.Item>
  }

  return (
    <>
      <div className="flex justify-center min-w-4 min-h-4">
        <div>
          <Menu>
            <div>
              <Menu.Button className={classNames('flex gap-2 justify-center min-w-8 min-h-8  dark:hover:bg-transparent hover:bg-transparent px-1', nethTheme.button.ghost, nethTheme.button.base, nethTheme.button.rounded.base)}>
                <div>
                  {t(`SpeedDial.${speeddialsModule?.favouriteOrder} label`)}
                </div>
                <FontAwesomeIcon
                  className={classNames("relative top-[-3px]  text-base", nethTheme.button.ghost, nethTheme.button.base, nethTheme.button.rounded.base)}
                  icon={ArrowMenuIcon}
                />
              </Menu.Button>
            </div>
            <Menu.Items
              className={`absolute border dark:border-borderDark border-borderLight rounded-lg min-w-[180px] min-h-[84px] dark:bg-bgDark bg-bgLight translate-x-[calc(-100%+36px)] z-[110]`}
            >
              <div className="min-w-[200px] dark:text-titleDark text-titleLight pt-3 pl-7">
                {t('SpeedDial.Order by')}
              </div>
              <RenderMenuItem type={FilterTypes.AZ} />
              <RenderMenuItem type={FilterTypes.ZA} />
              <RenderMenuItem type={FilterTypes.EXT} />
            </Menu.Items>
          </Menu >
        </div >
      </div >
    </>
  )
}
