import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck as ChooseThemeMenuIcon } from '@fortawesome/free-solid-svg-icons'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import classNames from 'classnames'
import { IconDefinition } from '@nethesis/nethesis-solid-svg-icons'
import { menuRowClassName } from './MenuAction'

type SettingsOptionElementProps = {
  icon?: IconProp | IconDefinition
  iconElem?: JSX.Element
  label: string
  isSelected: boolean
  // false for a row that opens something instead of choosing an option
  selectable?: boolean
  onClick: () => void
}
export const OptionElement = ({
  icon,
  iconElem,
  label,
  isSelected,
  selectable = true,
  onClick,
}: SettingsOptionElementProps) => {
  return (
    <button
      type='button'
      aria-pressed={selectable ? isSelected : undefined}
      className={classNames(menuRowClassName, 'justify-between')}
      onClick={() => onClick()}
    >
      <span className='flex w-full items-center gap-3'>
        {iconElem ? (
          iconElem
        ) : icon ? (
          <FontAwesomeIcon
            className='size-4 shrink-0'
            icon={icon as IconProp}
            aria-hidden='true'
          />
        ) : (
          <></>
        )}
        <span className='w-full'>{label}</span>
      </span>
      {isSelected && (
        <FontAwesomeIcon
          className='size-4 shrink-0'
          icon={ChooseThemeMenuIcon}
          aria-hidden='true'
        />
      )}
    </button>
  )
}
