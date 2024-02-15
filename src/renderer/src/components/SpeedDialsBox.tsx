import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
import { NumberBox } from './NumberBox'
import { Button } from '@nethesis/react-components/src/components/common'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useState } from 'react'

export interface SpeedDialsBoxProps {
  title: string
  label?: string
  onClick?: () => void
  callUser: (phoneNumber: string) => void
  showNumberDetails: (elem: any) => void
}

export function SpeedDialsBox({
  title,
  label,
  onClick,
  callUser,
  showNumberDetails
}: SpeedDialsBoxProps): JSX.Element {

  const [speeddials, setSpeeddials] = useState<any[]>()
  useInitialize(() => {
    getSpeeddials()
  })

  async function getSpeeddials() {
    const response = await window.api.getSpeeddials()
    console.log(response)
    setSpeeddials(() => response)
  }

  return (
    <div className="flex flex-col gap-4 min-h-[284px]">
      <div className="flex justify-between py-1 border border-t-0 border-r-0 border-l-0 border-gray-700 font-semibold min-h-[28px]">
        {/**DA MODIFICARE IL FONT */}
        <h1 className="text-gray-50">{title}</h1>
        <div className="flex gap-3 items-center">
          <Button onClick={onClick} className="h-4 w-4 border-none">
            <FontAwesomeIcon style={{ fontSize: '16px', color: '#3B82F6' }} icon={faCirclePlus} />
          </Button>
          {label && <p className="text-blue-500">{label}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[240px]">
        {/**Aggiungere props */}
        {speeddials?.map((e) => {
          return <div className="border-b pb-2 border-gray-700">
            <NumberBox
              name={e.name}
              number={e.speeddial_num}
              callUser={() => callUser(e.speeddial_num)}
              showNumberDetails={() => showNumberDetails(e)}
            />
          </div>
        })}
      </div>
    </div>
  )
}
