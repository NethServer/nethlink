import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { NewContactType, ContactType, NewSpeedDialType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useForm, SubmitHandler } from 'react-hook-form'

interface SpeedDialFormBoxProps {
  initialData?: ContactType | null
  onSubmit: (data: NewContactType | NewSpeedDialType) => Promise<void>
  onCancel: () => void
}

export function SpeedDialFormBox({
  initialData = null,
  onSubmit,
  onCancel
}: SpeedDialFormBoxProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<NewContactType | NewSpeedDialType>({
    defaultValues: initialData || {
      name: '',
      speeddial_num: ''
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name!)
      setValue('speeddial_num', initialData.speeddial_num)
    }
  }, [initialData, setValue])

  const onSubmitForm: SubmitHandler<NewContactType | NewSpeedDialType> = (data) => {
    handleSave(data)
  }

  function handleSave(data: NewContactType | NewSpeedDialType) {
    setIsLoading(true)
    onSubmit(data)
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
        <h1 className="font-semibold dark:text-gray-50 text-gray-900">
          {initialData ? t('SpeedDial.Edit speed dial') : t('SpeedDial.Create speed dial')}
        </h1>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmitForm)}>
        <TextInput
          {...register('name', { required: true })}
          type="text"
          className="font-normal"
          label={t('Phonebook.Name') as string}
          error={Boolean(errors.name)}
        />
        <TextInput
          {...register('speeddial_num', { required: true })}
          type="tel"
          minLength={3}
          className="font-normal"
          label={t('Phonebook.Phone number') as string}
          error={Boolean(errors.speeddial_num)}
        />
        <div className="absolute bottom-0 right-0 flex flex-row gap-4">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('Common.Cancel')}</p>
          </Button>
          <Button type="submit" className="dark:bg-blue-500 bg-blue-600 gap-3" disabled={isLoading}>
            <p className="dark:text-gray-900 text-gray-50 font-semibold">
              {initialData ? t('Common.Edit') : t('SpeedDial.Create')}
            </p>
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
