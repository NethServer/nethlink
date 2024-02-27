import { ReactNode } from 'react'
import { Avatar, Button } from './Nethesis'
import { NumberCaller } from './NumberCaller'
import { PlaceholderIcon } from '@renderer/icons/PlaceholderIcon'

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
        <span className="dark:text-blue-500 text-blue-600 font-semibold">
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
    <div className="flex justify-between w-full min-h-14 px-2 py-2 dark:text-gray-50 text-gray-900">
      <div className="flex gap-3 items-center">
        <Avatar size="small" placeholder={PlaceholderIcon} bordered={true} />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{name}</p>
          <NumberCaller number={number}>{highlightedNumber}</NumberCaller>
        </div>
      </div>
      <Button variant="ghost" onClick={callUser}>
        <p className="dark:text-blue-500 text-blue-600 font-semibold dark:hover:bg-gray-700 hover:bg-gray-200">
          Call
        </p>
      </Button>
    </div>
  )
}
