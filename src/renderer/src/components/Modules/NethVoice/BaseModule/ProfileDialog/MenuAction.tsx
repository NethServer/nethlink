import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import { ReactElement } from 'react'

type BaseMenuActionProps = {
  className?: string
  onClick: () => void
}

type MenuActionProps = {
  label: string
  icon?: IconProp
  iconElem?: JSX.Element
  chevronVisible?: boolean
} & BaseMenuActionProps

type MenuActionWrapProps = {
  children: ReactElement | ReactElement[]
} & BaseMenuActionProps

// the row of the profile menu: hover and keyboard focus share the same background
export const menuRowClassName =
  'flex w-full items-center gap-3 px-4 py-2 text-left text-sm leading-5 text-titleLight dark:text-titleDark hover:bg-hoverLight dark:hover:bg-hoverDark focus:outline-none focus-visible:bg-hoverLight dark:focus-visible:bg-hoverDark'

function MenuAction({ className, children, onClick }: MenuActionWrapProps) {
  return (
    <button
      type='button'
      className={classNames(menuRowClassName, 'min-h-9', className)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const MenuChevron = () => (
  <FontAwesomeIcon
    icon={faAngleRight}
    className='ml-auto size-4 shrink-0'
    aria-hidden='true'
  />
)

MenuAction.item = (props: MenuActionProps) => (
  <MenuAction {...props}>
    {props.icon ? (
      <FontAwesomeIcon
        className='size-4 shrink-0'
        icon={props.icon}
        aria-hidden='true'
      />
    ) : (
      props.iconElem || <></>
    )}
    <span>{props.label}</span>
    {props.chevronVisible ? <MenuChevron /> : <></>}
  </MenuAction>
)
MenuAction.itemWrap = (props: MenuActionWrapProps) => (
  <MenuAction {...props}>{props.children}</MenuAction>
)
MenuAction.chevron = MenuChevron

export { MenuAction }
