import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { NumberBox } from './NumberBox'
import { Button } from '@nethesis/react-components/src/components/common'

export interface SpeedDialsBoxProps {
  title: string
  label?: string
  onClick?: () => void
  callUser: () => void
  showNumberDetails: () => void
}

export function SpeedDialsBox({
  title,
  label,
  onClick,
  callUser,
  showNumberDetails
}: SpeedDialsBoxProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 min-h-[284px]">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 border-gray-700 font-semibold max-h-[28px]">
        <h1>{title}</h1>
        <Button className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0" onClick={onClick}>
          <FontAwesomeIcon style={{ fontSize: '16px', color: '#3B82F6' }} icon={faCirclePlus} />
          <p className="text-blue-500">{label}</p>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[240px]">
        <div className="border-b pb-2 border-gray-700">
          <NumberBox
            name="Nome Utente"
            number={3275757265}
            callUser={callUser}
            showNumberDetails={showNumberDetails}
          />
        </div>
        <div className="border-b pb-2 border-gray-700">
          <NumberBox
            name="Nome Utente"
            number={3275757265}
            callUser={callUser}
            showNumberDetails={showNumberDetails}
          />
        </div>
        <div className="border-b pb-2 border-gray-700">
          <NumberBox
            name="Nome Utente"
            number={3275757265}
            callUser={callUser}
            showNumberDetails={showNumberDetails}
          />
        </div>
        <NumberBox
          name="Nome Utente"
          number={3275757265}
          callUser={callUser}
          showNumberDetails={showNumberDetails}
        />
      </div>
    </div>
  )
}
