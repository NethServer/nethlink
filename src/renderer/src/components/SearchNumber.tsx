import { Avatar, Button } from '@nethesis/react-components/src/components/common'
import { PlaceholderIcon } from '@renderer/icons/PlaceholderIcon'
import { ReactNode } from 'react'

export interface SearchNumberProps {
  name: string
  number: string
  callUser: () => void
  searchText: string
}

export function SearchNumber({ name, number, callUser, searchText }: SearchNumberProps) {
  function highlightMatch(number: string, searchText: string): ReactNode[] {
    const parts: ReactNode[] = []
    let lastIndex = 0
    const lowerText = number.toLowerCase()
    const lowerSearchText = searchText.toLowerCase()
    let index = lowerText.indexOf(lowerSearchText)
    while (index !== -1) {
      parts.push(number.substring(lastIndex, index))
      parts.push(
        <span className="text-blue-500 font-semibold">
          {number.substring(index, index + searchText.length)}
        </span>
      )
      lastIndex = index + searchText.length
      index = lowerText.indexOf(lowerSearchText, lastIndex)
    }
    parts.push(number.substring(lastIndex))
    return parts
  }

  const highlightedNumber = highlightMatch(number, searchText)

  return (
    <div className="flex justify-between w-full min-h-14 px-2 py-2 text-gray-200">
      <div className="flex gap-3 items-center">
        <Avatar size="small" placeholder={PlaceholderIcon} bordered={true} />
        <div className="flex flex-col gap-1">
          <p>{name}</p>
          <p>{highlightedNumber}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={callUser}>
        <p className="text-blue-500 font-semibold">Call</p>
      </Button>
    </div>
  )
}
