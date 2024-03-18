import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faCircleNotch, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { ContactType, NewSpeedDialType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useForm, SubmitHandler } from 'react-hook-form'

export interface EditSpeedDialProps {
  selectedSpeedDial: ContactType
  handleEditContactToSpeedDials: (
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ) => Promise<void>
  onCancel: () => void
}

export function EditSpeedDialBox({
  selectedSpeedDial,
  handleEditContactToSpeedDials,
  onCancel
}: EditSpeedDialProps) {
  const { register, watch, handleSubmit, setValue, reset } = useForm<NewSpeedDialType>({
    defaultValues: {
      name: '',
      speeddial_num: ''
    }
  })
  const onSubmit: SubmitHandler<NewSpeedDialType> = (data) => {
    handleEdit(data)
  }
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    setValue('name', selectedSpeedDial.name!)
    setValue('speeddial_num', selectedSpeedDial.speeddial_num)
  }, [])

  function handleEdit(data) {
    handleEditContactToSpeedDials(data, selectedSpeedDial)
      .catch((error) => {
        log(error)
      })
      .finally(() => {
        setIsLoading(false)
        reset()
      })
  }

  return (
    <div className="flex flex-col gap-4 min-h-[284px] relative">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
        <h1 className="font-semibold dark:text-gray-50 text-gray-900">Edit speed dial</h1>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          setIsLoading(true)
          e.preventDefault()
          setTimeout(() => {
            handleSubmit(onSubmit)(e)
          }, 100)
        }}
      >
        <TextInput
          {...register('name')}
          type="text"
          className="font-normal"
          label={t('Phonebook.Name') as string}
        />
        <TextInput
          {...register('speeddial_num')}
          type="tel"
          minLength={3}
          onChange={(e) => {
            setValue('speeddial_num', e.target.value.replace(/\D/g, ''))
          }}
          className="font-normal"
          label={t('Phonebook.Phone number') as string}
        />
        <div className="absolute bottom-0 right-0 flex flex-row gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('Common.Cancel')}</p>
          </Button>
          <Button
            type="submit"
            className="dark:bg-blue-500 bg-blue-600 gap-3"
            disabled={!watch('name') || !watch('speeddial_num')}
          >
            <p className="dark:text-gray-900 text-gray-50 font-semibold">{t('Common.Edit')}</p>
            {isLoading && (
              <FontAwesomeIcon
                icon={faSpinner}
                className="dark:text-gray-900 text-gray-50 animate-spin"
              />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
