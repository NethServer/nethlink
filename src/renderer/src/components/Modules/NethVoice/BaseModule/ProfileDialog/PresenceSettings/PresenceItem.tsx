import { StatusTypes } from "@shared/types";
import {
  IconDefinition,
  faCheck as ChooseThemeMenuIcon,
} from "@fortawesome/free-solid-svg-icons";
import { StatusDot } from "@renderer/components/Nethesis";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAccount } from "@renderer/hooks/useAccount";
import classNames from "classnames";
export interface PresenceItemProps {
  presenceName: string,
  presenceDescription: string,
  status: StatusTypes,
  icon?: IconDefinition,
  hasTopBar?: boolean,
  onClick: (status: StatusTypes) => void
}

export function PresenceItem({
  presenceName,
  presenceDescription,
  status,
  hasTopBar,
  icon,
  onClick
}: PresenceItemProps) {

  const { status: currentStatus } = useAccount()

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(status)
  }

  return (
    <>
      {hasTopBar ? <div className='mt-3 border-t-[1px] dark:border-borderDark border-borderLight '></div> : null}
      <div className={classNames("px-4 py-2 cursor-pointer w-full flex flex-row items-center gap-1 text-bgDark dark:text-bgLight hover:bg-hoverLight hover:dark:bg-hoverDark", hasTopBar ? 'mt-3' : '')}
        onClick={handleClick}
      >
        <div className={`flex flex-col gap-1 w-full`} >
          <div className="flex flex-row gap-2 items-center">
            <StatusDot status={status} />
            <div className="flex flex-row gap-2 items-center">
              {presenceName}
              {icon && <FontAwesomeIcon icon={icon} />}
            </div>
          </div>
          <div className="text-sm">{presenceDescription}</div>
        </div>
        {currentStatus === status && (
          <FontAwesomeIcon
            className="dark:text-gray-50 text-gray-700"
            style={{ fontSize: '16px' }}
            icon={ChooseThemeMenuIcon}
          />
        )}
      </div>
    </>
  )
}
