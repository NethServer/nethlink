import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCheck as ChooseThemeMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import classNames from "classnames"
import { IconDefinition } from "@nethesis/nethesis-solid-svg-icons"

type SettingsOptionElementProps = {
  icon?: IconProp | IconDefinition,
  iconElem?: JSX.Element,
  label: string,
  isSelected: boolean
  onClick: () => void,
}
export const OptionElement = ({
  icon,
  iconElem,
  label,
  isSelected,
  onClick,
}: SettingsOptionElementProps) => {

  return (
    <div
      className={
        classNames(
          "cursor-pointer",
          'flex flex-row items-center',
          'justify-between',
          'gap-4 px-4 py-2',
          'dark:text-gray-50 text-gray-700',
          'dark:hover:bg-hoverDark hover:bg-hoverLight',
        )}
      onClick={() => onClick()}
    >
      <div className={
        classNames(
          "flex flex-row items-center gap-2 w-full",
        )}
      >
        {iconElem ? iconElem : icon ? <FontAwesomeIcon className="text-base" icon={icon as IconProp} /> : <></>}
        <p className="font-normal w-full">
          {label}
        </p>
      </div>
      {isSelected && (
        <FontAwesomeIcon
          className="dark:text-gray-50 text-gray-700"
          style={{ fontSize: '16px' }}
          icon={ChooseThemeMenuIcon}
        />
      )}
    </div>
  )
}
