import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button } from "./Nethesis"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { DefaultTFuncReturn } from "i18next"
import { ReactNode } from "react"
import { ClassNames } from "@renderer/utils"
import { Tooltip } from 'react-tooltip'

export interface ModuleTitleProps {
  title?: string | DefaultTFuncReturn | ReactNode,
  action?: () => void,
  actionText?: string | DefaultTFuncReturn,
  actionIcon?: IconProp
  actionComponent?: ReactNode,
  className?: string

}
export const ModuleTitle = ({
  title,
  action,
  actionText,
  actionIcon,
  actionComponent,
  className
}: ModuleTitleProps) => {

  return (
    <div className="px-5">
      <div className={ClassNames("flex justify-between items-center pb-1 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight h-[28px]", className)}>
        {title && <h1
          className="font-medium text-base leading-5 dark:text-titleDark text-titleLight truncate"
          data-tooltip-id={`tooltip-module-title`}
          data-tooltip-content={title as string}
        >
          {title}
        </h1>}
        <Tooltip
          id={`tooltip-module-title`}
          place="bottom"
          className="z-10"
          opacity={1}
          noArrow={false}
        />
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
            {actionText && <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px]] leading-5">
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
