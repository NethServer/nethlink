import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { ReactElement } from "react"

type BaseMenuActionProps = {
  className?: string,
  onClick: () => void,
}

type MenuActionProps = {
  label: string,
  icon: IconProp
} & BaseMenuActionProps

type MenuActionWrapProps = {
  children: ReactElement | ReactElement[]
} & BaseMenuActionProps

function MenuAction({ className, children, onClick }: MenuActionWrapProps) {

  return (
    <div className={className} onClick={onClick}>
      <div className={classNames("cursor-pointer dark:text-titleDark text-titleLight dark:hover:bg-hoverDark hover:bg-hoverLight h-[36px] px-4 py-2")}>
        <div
          className="flex flex-row items-center gap-4"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

MenuAction.item = (props: MenuActionProps) => <MenuAction {...props}>
  <FontAwesomeIcon className="text-base" icon={props.icon} />
  <p className="font-normal">{props.label}</p>
</MenuAction>
MenuAction.itemWrap = (props: MenuActionWrapProps) => <MenuAction {...props}>{props.children}</MenuAction>

export {
  MenuAction
}
