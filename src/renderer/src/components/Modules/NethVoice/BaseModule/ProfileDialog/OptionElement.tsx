import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCheck as ChooseThemeMenuIcon,
} from '@fortawesome/free-solid-svg-icons'
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import classNames from "classnames"

type SettingsOptionElementProps = {
  icon: IconProp,
  label: string,
  isSelected: boolean
  onClick: () => void,
}
export const OptionElement = ({
  icon,
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
          "flex items-center gap-2",
        )}
      >
        <FontAwesomeIcon className="text-base" icon={icon} />
        <p className="font-normal">
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
