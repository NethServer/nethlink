import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faSpinner as LoadingIcon } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { NewContactType, ContactType, NewSpeedDialType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type SpeedDialFormBoxData = {
  name: string
  speeddial_num: string
}

interface SpeedDialFormBoxProps {
  initialData?: ContactType
  onSubmit: (data: NewContactType | NewSpeedDialType) => Promise<void>
  onCancel: () => void
}

export function SpeedDialFormBox({ initialData, onSubmit, onCancel }: SpeedDialFormBoxProps) {
  const schema: z.ZodType<SpeedDialFormBoxData> = z.object({
    name: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
    speeddial_num: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`)
      .min(3, `${t('Common.This field must be at least', { number: '3' })}`)
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NewContactType | NewSpeedDialType>({
    defaultValues: initialData,
    resolver: zodResolver(schema)
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

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
    <div className="flex flex-col gap-4 h-full relative">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
        <h1 className="font-medium dark:text-gray-50 text-gray-900">
          {initialData ? t('SpeedDial.Edit speed dial') : t('SpeedDial.Create speed dial')}
        </h1>
      </div>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmitForm)}>
        <TextInput
          {...register('name', { required: true })}
          type="text"
          className={`font-normal`}
          label={t('Phonebook.Name') as string}
          helper={errors.name?.message || undefined}
          error={!!errors.name?.message}
        />
        <TextInput
          {...register('speeddial_num', { required: true })}
          type="tel"
          minLength={3}
          className="font-normal"
          label={t('Phonebook.Phone number') as string}
          helper={errors.speeddial_num?.message || undefined}
          error={!!errors.speeddial_num?.message}
        />
        <div className="absolute bottom-0 right-0 flex flex-row gap-4">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            <p className="dark:text-blue-500 text-blue-600 font-medium">{t('Common.Cancel')}</p>
          </Button>
          <Button type="submit" className="dark:bg-blue-500 bg-blue-600 gap-3" disabled={isLoading}>
            <p className="dark:text-gray-900 text-gray-50 font-medium">
              {initialData ? t('Common.Edit') : t('SpeedDial.Create')}
            </p>
            {isLoading && (
              <FontAwesomeIcon
                icon={LoadingIcon}
                className="dark:text-gray-900 text-gray-50 animate-spin"
              />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
