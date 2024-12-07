import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { TimedComponent } from "./TimedComponent"


export interface EmptyListProps {
  icon: IconProp,
  text: string
}
export const EmptyList = ({ icon, text }: EmptyListProps) => {
  return (
    <TimedComponent timer={100}>
      <div className={classNames("flex flex-col justify-between items-center gap-5 py-[28px] bg-hoverLight dark:bg-hoverDark min-h-[132px] mt-4 rounded-lg ml-5 mr-3")}>
        <div className="text-emptyIconLight dark:text-emptyIconDark">
          <FontAwesomeIcon icon={icon} className="text-[28px] " />
        </div>
        <span className="text-center text-emptyTextLight dark:text-emptyTextDark text-sm">{text}</span>
      </div>
    </TimedComponent>
  )
}
