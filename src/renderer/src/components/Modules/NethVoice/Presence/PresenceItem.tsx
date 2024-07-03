import { StatusTypes } from "@shared/types";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { StatusDot } from "@renderer/components/Nethesis";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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


  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(status)
  }

  return (
    <>
      {hasTopBar ? <div className='mt-3 border-t-[1px] dark:border-borderDark border-borderLight '></div> : null}
      <div className={`cursor-pointer flex flex-col gap-1 w-full px-4 py-2 text-bgDark dark:text-bgLight hover:bg-hoverLight hover:dark:bg-hoverDark ${hasTopBar ? 'mt-3' : ''}`} onClick={handleClick}>
        <div className="flex flex-row gap-2 items-center">
          <StatusDot status={status} />
          <div className="flex flex-row gap-2 items-center">
            {presenceName}
            {icon && <FontAwesomeIcon icon={icon} />}
          </div>
        </div>
        <div className="text-sm">{presenceDescription}</div>
      </div>
    </>
  )
}
