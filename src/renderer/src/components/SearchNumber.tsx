import { Avatar, Button } from '@nethesis/react-components/src/components/common'
import { PlaceholderIcon } from '@renderer/icons/PlaceholderIcon'

export interface SearchNumberProps {
  name: string
  number: string
  callUser: () => void
}

export function SearchNumber({ name, number, callUser }: SearchNumberProps) {
  return (
    <div className="flex justify-between w-full min-h-14 px-2 py-2 text-gray-200">
      <div className="flex gap-3 items-center">
        <Avatar size="small" placeholder={PlaceholderIcon} bordered={true} />
        <div className="flex flex-col gap-1">
          <p>{name}</p>
          <p>{number}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={callUser}>
        <p className="text-blue-500 font-semibold">Call</p>
      </Button>
    </div>
  )
}
