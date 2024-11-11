import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button } from "./Nethesis"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { DefaultTFuncReturn } from "i18next"
import { ReactNode } from "react"

export interface ModuleTitleProps {
  title: string | DefaultTFuncReturn,
  action?: () => void,
  actionText?: string | DefaultTFuncReturn,
  actionIcon?: IconProp
  actionComponent?: ReactNode

}
export const ModuleTitle = ({
  title,
  action,
  actionText,
  actionIcon,
  actionComponent
}: ModuleTitleProps) => {

  return (
    <div className="px-5">
      <div className="flex justify-between items-center pb-1 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight h-[28px]">
        <h1 className="font-medium text-[14px] leading-5 dark:text-titleDark text-titleLight">
          {title}
        </h1>
        {action && (
          <Button
            variant="ghost"
            size="small"
            className="flex gap-3 items-center px-[4px] py-3 mr-[2px] h-0"
            onClick={action}
          >
            {actionIcon && <FontAwesomeIcon
              className="text-base dark:text-textBlueDark text-textBlueLight"
              icon={actionIcon}
            />}
            {actionText && <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
              {actionText}
            </p>
            }
          </Button>
        )}
        {actionComponent}
      </div>
    </div>
  )
}
