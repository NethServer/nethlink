import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useRef, useState } from 'react'

export interface CreateSpeedDialProps {
  setIsCreatingSpeedDial: (isCreating: boolean) => void
  setIsAddedSuccessfully: (isAdded: boolean) => void
}

export function CreateSpeedDialBox({
  setIsCreatingSpeedDial,
  setIsAddedSuccessfully
}: CreateSpeedDialProps) {
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
      setIsAddedSuccessfully(true)
      setIsLoading(false)
      setIsCreatingSpeedDial(false)
      setName('')
      setPhoneNumber('')
    }, 2000)

    setTimeout(() => {
      setIsAddedSuccessfully(false)
    }, 5000)
  }

  return (
    <>
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 border-gray-700 max-h-[28px]">
        <h1 className="font-semibold">Create speed dial</h1>
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
      <div className="flex flex-row gap-4 justify-end mt-2">
        <Button
          variant="ghost"
          className="text-blue-500"
          onClick={() => setIsCreatingSpeedDial(false)}
        >
          <p className="text-blue-500 font-semibold">Cancel</p>
        </Button>
        <Button
          className="bg-blue-500 gap-3"
          disabled={name.trim().length === 0 || phoneNumber.trim().length < 3}
          onClick={handleCreateSpeedDial}
        >
          <p className="text-black font-semibold">Create</p>
          {isLoading && <FontAwesomeIcon icon={faCircleNotch} className="text-black" spin />}
        </Button>
      </div>
    </>
  )
}
