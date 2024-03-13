import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'
import { ContactType, NewSpeedDialType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useForm, SubmitHandler } from 'react-hook-form'

export interface EditSpeedDialProps {
  selectedId?: string
  selectedName?: string
  selectedNumber?: string
  handleEditContactToSpeedDials: (
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ) => Promise<void>
  onCancel: () => void
}

export function EditSpeedDialBox({
  selectedId,
  selectedName,
  selectedNumber,
  handleEditContactToSpeedDials,
  onCancel
}: EditSpeedDialProps) {
  const { register, watch, handleSubmit, setValue, reset } = useForm<NewSpeedDialType>()
  const onSubmit: SubmitHandler<NewSpeedDialType> = (data) => {
    handleEdit(data)
  }
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    setValue('name', selectedName as string)
    setValue('speeddial_num', selectedNumber as string)
  }, [])

  function handleEdit(data) {
    const oldData: ContactType = {
      id: selectedId,
      name: selectedName,
      speeddial_num: selectedNumber
    }
    setIsLoading(true)
    handleEditContactToSpeedDials(data, oldData)
      .catch((error) => {
        log(error)
      })
      .finally(() => {
        setIsLoading(false)
        reset({
          name: '',
          speeddial_num: ''
        })
      })
  }

  return (
    <div className="flex flex-col gap-4 min-h-[284px] relative">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
        <h1 className="font-semibold dark:text-gray-50 text-gray-900">Edit speed dial</h1>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          handleSubmit(onSubmit)(e)
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
                icon={faCircleNotch}
                className="dark:text-gray-900 text-gray-50"
                spin
              />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}