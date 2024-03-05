import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { NewContactType } from '@shared/types'

export interface CreateSpeedDialProps {
  onCancel: () => void
  handleAddContactToSpeedDials: (contact: NewContactType) => Promise<void>
}

export function CreateSpeedDialBox({
  handleAddContactToSpeedDials,
  onCancel
}: CreateSpeedDialProps) {
  const [name, setName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  function handleSave(_event: React.MouseEvent) {
    setIsLoading(true)
    //Da aggiungere la visibility
    handleAddContactToSpeedDials({ name: name, speeddial_num: phoneNumber })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setIsLoading(false)
        setName('')
        setPhoneNumber('')
      })
  }

  return (
    <div className="flex flex-col gap-4 min-h-[284px]">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
        <h1 className="font-semibold dark:text-gray-50 text-gray-900">Create speed dial</h1>
      </div>
      <label className="flex flex-col gap-2">
        <p className="dark:text-gray-50 text-gray-900 font-semibold">Name</p>
        <TextInput
          type="text"
          value={name}
          onChange={(e) => {
            setName(() => e.target.value)
          }}
        />
      </label>
      <label className="flex flex-col gap-2">
        <p className="dark:text-gray-50 text-gray-900 font-semibold">Phone number</p>
        <TextInput
          type="tel"
          pattern="[0-9]*"
          minLength={3}
          value={phoneNumber}
          onChange={(e) => {
            const cleanedValue = e.target.value.replace(/\D/g, '')

            if (phoneNumber) {
              setPhoneNumber(() => phoneNumber)
            }
            setPhoneNumber(cleanedValue)
          }}
        />
      </label>

      <div className="flex flex-row gap-4 justify-end mt-2">
        <Button variant="ghost" onClick={onCancel}>
          <p className="dark:text-blue-500 text-blue-600 font-semibold">Cancel</p>
        </Button>
        <Button
          className="dark:bg-blue-500 bg-blue-600 gap-3"
          disabled={name.trim().length === 0 || phoneNumber.trim().length < 3}
          onClick={handleSave}
        >
          <p className="dark:text-gray-900 text-gray-50 font-semibold">Create</p>
          {isLoading && (
            <FontAwesomeIcon
              icon={faCircleNotch}
              className="dark:text-gray-900 text-gray-50"
              spin
            />
          )}
        </Button>
      </div>
    </div>
  )
}
