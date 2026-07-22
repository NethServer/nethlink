import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { TimedComponent } from "./TimedComponent"


export interface EmptyListProps {
  icon: IconProp,
  text: string,
  subtitle?: string
}
export const EmptyList = ({ icon, text, subtitle }: EmptyListProps) => {
  return (
    <TimedComponent timer={100}>
      <div className={classNames("flex flex-col justify-center items-center gap-5 py-7 px-4 bg-[#f3f4f6] dark:bg-[#1f2937] min-h-[132px] mt-4 rounded-md ml-5 mr-3")}>
        <div className="text-emptyIconLight dark:text-emptyIconDark">
          <FontAwesomeIcon icon={icon} className="text-[32px]" />
        </div>
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-center text-emptyTextLight dark:text-emptyTextDark font-medium text-sm leading-6">{text}</span>
          {subtitle && (
            <span className="text-center text-gray-600 dark:text-gray-400 font-normal text-xs leading-4">{subtitle}</span>
          )}
        </div>
      </div>
    </TimedComponent>
  )
}
