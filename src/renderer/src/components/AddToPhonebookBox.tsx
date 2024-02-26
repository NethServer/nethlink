import { useState, useRef } from 'react'
import { Button, TextInput } from './Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

export interface AddToPhonebookBoxProps {
  setIsAddingToPhonebook: (isAdding: boolean) => void
  setIsContactSaved: (isSaved: boolean) => void
  handleReset: () => void
}

export function AddToPhonebookBox({
  setIsAddingToPhonebook,
  setIsContactSaved,
  handleReset
}: AddToPhonebookBoxProps) {
  const [name, setName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState('')
  const [type, setType] = useState('')

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneNumberRef = useRef<HTMLInputElement>(null)
  const visibilityRef = useRef<HTMLInputElement>(null)
  const typeRef = useRef<HTMLInputElement>(null)

  /* TODO da aggiungere una chiamata alle api in cui si aggiunge il nuovo numero*/
  async function handleSaveToPhonebook() {
    setIsLoading(true)
    console.log('Add to Phonebook', { name, phoneNumber })
    setTimeout(() => {
      setIsContactSaved(true)
      setIsLoading(false)
      setIsAddingToPhonebook(false)
      setName('')
      setPhoneNumber('')
      handleReset()
    }, 2000)

    setTimeout(() => {
      setIsContactSaved(false)
    }, 5000)
  }

  return (
    <div className="px-4 w-full h-full">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 border-gray-700 max-h-[28px]">
        <h1 className="font-semibold">Add to Phonebook</h1>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[240px]">
        <div>
          <label className="font-semibold">Visibility</label>
          <div className="flex flex-row gap-8">
            <div className="flex gap-2">
              <input
                ref={visibilityRef}
                type="radio"
                value="Everybody"
                checked={visibility === 'Everybody'}
                onChange={() => setVisibility('Everybody')}
                name="visibility"
              />
              Everybody
            </div>
            <div className="flex gap-2">
              <input
                ref={visibilityRef}
                type="radio"
                value="Only me"
                checked={visibility === 'Only me'}
                onChange={() => setVisibility('Only me')}
                name="visibility"
              />
              Only me
            </div>
          </div>
        </div>

        <div>
          <label className="font-semibold">Type</label>
          <div className="flex flex-row gap-8">
            <div className="flex gap-2">
              <input
                ref={typeRef}
                type="radio"
                value="Person"
                checked={type === 'Person'}
                onChange={() => setType('Person')}
                name="type"
              />
              Person
            </div>
            <div className="flex gap-2">
              <input
                ref={typeRef}
                type="radio"
                value="Company"
                checked={type === 'Company'}
                onChange={() => setType('Company')}
                name="type"
              />
              Company
            </div>
          </div>
        </div>

        <TextInput
          ref={nameRef}
          type="text"
          label="Name"
          value={name}
          onChange={(e) => {
            nameRef.current!.value = e.target.value
            setName(() => nameRef.current!.value)
          }}
        />
        <TextInput
          ref={phoneNumberRef}
          type="tel"
          label="Phone number"
          pattern="[0-9]*"
          minLength={3}
          value={phoneNumber}
          onChange={(e) => {
            const value = e.target.value
            const cleanedValue = value.replace(/\D/g, '')

            if (phoneNumberRef.current) {
              phoneNumberRef.current.value = cleanedValue
            }
            setPhoneNumber(cleanedValue)
          }}
        />
        <div className="flex flex-row gap-4 justify-end">
          <Button
            variant="ghost"
            className="text-blue-500"
            onClick={() => {
              setIsAddingToPhonebook(false)
              handleReset()
            }}
          >
            <p className="text-blue-500 font-semibold">Cancel</p>
          </Button>
          <Button
            className="bg-blue-500 gap-3"
            disabled={
              name.trim().length === 0 ||
              phoneNumber.trim().length < 3 ||
              visibility === '' ||
              type === ''
            }
            onClick={handleSaveToPhonebook}
          >
            <p className="text-black font-semibold">Save</p>
            {isLoading && <FontAwesomeIcon icon={faCircleNotch} className="text-black" spin />}
          </Button>
        </div>
      </div>
    </div>
  )
}
