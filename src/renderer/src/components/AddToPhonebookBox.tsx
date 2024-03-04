import { useState, useRef, useEffect } from 'react'
import { Button, TextInput } from './Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { SpeedDialType } from '@shared/types'

export interface AddToPhonebookBoxProps {
  searchText?: string
  onCancel: () => void
  handleAddContactToPhonebook: (contact: SpeedDialType) => Promise<void>
}

export function AddToPhonebookBox({
  searchText,
  onCancel,
  handleAddContactToPhonebook
}: AddToPhonebookBoxProps) {
  const [name, setName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState('')
  const [type, setType] = useState('')

  const visibilityRef = useRef<HTMLInputElement>(null)
  const typeRef = useRef<HTMLInputElement>(null)

  function containsOnlyNumber(text: string) {
    return /^\d+$/.test(text)
  }

  useEffect(() => {
    if (searchText !== undefined) {
      if (containsOnlyNumber(searchText)) {
        setPhoneNumber(searchText)
      } else {
        setName(searchText)
      }
    }
  }, [])

  function handleSave(_event: React.MouseEvent) {
    setIsLoading(true)
    //Da aggiungere la visibility
    handleAddContactToPhonebook({ name: name, speeddial_num: phoneNumber, type: type })
      .catch((error) => {
        console.log(error)
      })
      .finally(() => {
        setIsLoading(false)
        setName('')
        setPhoneNumber('')
        setType('')
        setVisibility('')
      })
  }

  return (
    <div className="px-4 w-full h-full">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 max-h-[28px]">
        <h1 className="font-semibold">Add to Phonebook</h1>
      </div>
      <div className="flex flex-col gap-4 p-2 min-h-[240px] h-full overflow-y-auto">
        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p>Visibility</p>
          <div className="flex flex-row gap-8 items-center">
            <div className="flex flex-row gap-2 items-center">
              <TextInput
                ref={visibilityRef}
                type="radio"
                value="Everybody"
                checked={visibility === 'Everybody'}
                onChange={() => setVisibility('Everybody')}
                name="visibility"
              />
              <p className="whitespace-nowrap">Everybody</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <TextInput
                ref={visibilityRef}
                type="radio"
                value="Only me"
                checked={visibility === 'Only me'}
                onChange={() => setVisibility('Only me')}
                name="visibility"
              />
              <p className="whitespace-nowrap">Only me</p>
            </div>
          </div>
        </label>

        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p>Type</p>
          <div className="flex flex-row gap-8 items-center">
            <div className="flex flex-row gap-2 items-center">
              <TextInput
                ref={typeRef}
                type="radio"
                value="Person"
                checked={type === 'Person'}
                onChange={() => setType('Person')}
                name="type"
              />
              <p className="whitespace-nowrap">Person</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <TextInput
                ref={typeRef}
                type="radio"
                value="Company"
                checked={type === 'Company'}
                onChange={() => setType('Company')}
                name="type"
              />
              <p className="whitespace-nowrap">Company</p>
            </div>
          </div>
        </label>

        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p className="whitespace-nowrap">Name</p>
          <TextInput
            type="text"
            value={name}
            onChange={(e) => {
              setName(() => e.target.value)
            }}
            className="font-normal"
          />
        </label>

        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p className="whitespace-nowrap">Phone number</p>
          <TextInput
            type="tel"
            pattern="[0-9]*"
            minLength={3}
            value={phoneNumber}
            onChange={(e) => {
              const cleanedValue = e.target.value.replace(/\D/g, '')
              if (phoneNumber) {
                setPhoneNumber(() => cleanedValue)
              }
              setPhoneNumber(cleanedValue)
            }}
            className="font-normal"
          />
        </label>

        <div className="flex flex-row gap-4 justify-end mb-5">
          <Button variant="ghost" onClick={() => onCancel()}>
            <p className="dark:text-blue-500 text-blue-600 font-semibold">Cancel</p>
          </Button>
          <Button
            className="dark:bg-blue-500 bg-blue-600 gap-3"
            disabled={
              name.trim().length === 0 ||
              phoneNumber.trim().length < 3 ||
              visibility === '' ||
              type === ''
            }
            onClick={handleSave}
          >
            <p className="dark:text-gray-900 text-gray-50 font-semibold">Save</p>
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
    </div>
  )
}
