import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useRef, useState } from 'react'

export interface CreateSpeedDialProps {
  setIsCreatingSpeedDial: (isCreating: boolean) => void
}

export function CreateSpeedDialBox({ setIsCreatingSpeedDial }: CreateSpeedDialProps) {
  const [name, setName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneNumberRef = useRef<HTMLInputElement>(null)

  /* TODO da aggiungere una chiamata alle api in cui si aggiunge la nuova SpeedDial */
  async function handleCreateSpeedDial() {
    setIsLoading(true)
    console.log('Creating speed dial', { name, phoneNumber })
    setTimeout(() => {
      setIsLoading(false)
      setIsCreatingSpeedDial(false)
      setName('')
      setPhoneNumber('')
    }, 2000)
  }

  return (
    <>
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
        <h1 className="font-semibold dark:text-gray-50 text-gray-900">Create speed dial</h1>
      </div>
      <label className="flex flex-col gap-2">
        <p className="dark:text-gray-50 text-gray-900 font-semibold">Name</p>
        <TextInput
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => {
            nameRef.current!.value = e.target.value
            setName(() => nameRef.current!.value)
          }}
        />
      </label>
      <label className="flex flex-col gap-2">
        <p className="dark:text-gray-50 text-gray-900 font-semibold">Phone number</p>
        <TextInput
          ref={phoneNumberRef}
          type="tel"
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
      </label>

      <div className="flex flex-row gap-4 justify-end mt-2">
        <Button variant="ghost" onClick={() => setIsCreatingSpeedDial(false)}>
          <p className="dark:text-blue-500 text-blue-600 font-semibold">Cancel</p>
        </Button>
        <Button
          className="dark:bg-blue-500 bg-blue-600 gap-3"
          disabled={name.trim().length === 0 || phoneNumber.trim().length < 3}
          onClick={handleCreateSpeedDial}
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
    </>
  )
}
