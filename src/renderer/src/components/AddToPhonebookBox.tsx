import { useState, useRef, useEffect } from 'react'
import { Button, TextInput } from './Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { NewContactType } from '@shared/types'

export interface AddToPhonebookBoxProps {
  searchText?: string
  selectedNumber?: string
  selectedCompany?: string
  onCancel: () => void
  handleAddContactToPhonebook: (contact: NewContactType) => Promise<void>
}

export function AddToPhonebookBox({
  searchText,
  selectedNumber,
  selectedCompany,
  onCancel,
  handleAddContactToPhonebook
}: AddToPhonebookBoxProps) {
  const [name, setName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>(selectedNumber)
  const [company, setCompany] = useState<string>(selectedCompany)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState('Everybody')
  const [type, setType] = useState('Person')

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
    if (company !== '') {
      setType(() => 'Company')
    }
  }, [])

  function handleSave(_event: React.MouseEvent) {
    setIsLoading(true)
    handleAddContactToPhonebook({
      name: name,
      speeddial_num: phoneNumber,
      type: type,
      company: company,
      privacy: visibility
    })
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
                type="radio"
                value="Person"
                checked={type === 'Person'}
                onChange={() => {
                  setType('Person')
                  setCompany('')
                }}
                name="type"
              />
              <p className="whitespace-nowrap">Person</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <TextInput
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

        {/* DA CHIEDERE QUALI ALTRI DATI SONO DA INSERIRE */}
        {type === 'Company' ? (
          <>
            <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
              <p className="whitespace-nowrap">Company</p>
              <TextInput
                type="text"
                value={company}
                onChange={(e) => {
                  setCompany(() => e.target.value)
                }}
                className="font-normal"
              />
            </label>
          </>
        ) : null}

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
              (type === 'Company' && company.trim().length === 0)
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
