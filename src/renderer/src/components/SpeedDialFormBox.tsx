import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from './Nethesis'
import { faSpinner as LoadingIcon } from '@fortawesome/free-solid-svg-icons'
import { useRef, useState } from 'react'
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

//TODO: concordare con gli altri il mesaggio di errore per il numero telefonico

export function SpeedDialFormBox({ initialData, onSubmit, onCancel }: SpeedDialFormBoxProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const schema: z.ZodType<SpeedDialFormBoxData> = z.object({
    name: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
    speeddial_num: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`)
      .min(3, `${t('Common.This field must be at least', { number: '3' })}`).regex(/^[0-9*#+]*$/, 'This is not a phone number')
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


  const onSubmitForm: SubmitHandler<NewContactType | NewSpeedDialType> = (data) => {
    handleSave(data)
  }

  function handleSave(data: NewContactType | NewSpeedDialType) {
    setIsLoading(true)
    onSubmit(data)
      .then(() => {
        reset()
      })
      .catch((error) => {
        log(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="flex flex-col gap-3 h-full relative">
      <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px] px-5 mt-3">
        <h1 className="font-medium text-[14px] leading-5 dark:text-gray-50 text-gray-900">
          {initialData ? t('SpeedDial.Edit speed dial') : t('SpeedDial.Create speed dial')}
        </h1>
      </div>
      <form
        className="flex flex-col gap-4 px-5"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(onSubmitForm)(e)
        }}
      >
        <TextInput
          {...register('name', { required: true })}
          type="text"
          label={t('Phonebook.Name') as string}
          helper={errors.name?.message || undefined}
          error={!!errors.name?.message}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitButtonRef.current?.focus()
              handleSubmit(onSubmitForm)(e)
            }
          }}
          className="font-medium text-[14px] leading-5 dark:focus:ring-2 dark:focus:ring-offset-2 dark:focus:ring-blue-200 dark:focus:ring-offset-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white"
        />
        <TextInput
          {...register('speeddial_num', { required: true })}
          type="tel"
          minLength={3}
          label={t('Phonebook.Phone number') as string}
          helper={errors.speeddial_num?.message || undefined}
          error={!!errors.speeddial_num?.message}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitButtonRef.current?.focus()
              handleSubmit(onSubmitForm)(e)
            }
          }}
          className="font-medium text-[14px] leading-5 dark:focus:ring-2 dark:focus:ring-offset-2 dark:focus:ring-blue-200 dark:focus:ring-offset-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white"
        />
        <div className="absolute bottom-1 right-0 flex flex-row gap-4 px-5">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="dark:focus:ring-2 focus:ring-2 dark:focus:ring-blue-200 focus:ring-blue-500"
          >
            <p className="dark:text-blue-500 text-blue-700 font-medium text-[14px] leading-5">
              {t('Common.Cancel')}
            </p>
          </Button>
          <Button
            type="submit"
            ref={submitButtonRef}
            // disabled={isLoading}
            className="gap-3 dark:bg-blue-500 bg-blue-700 dark:hover:bg-blue-300 hover:bg-blue-800 dark:focus:ring-2 dark:focus:ring-offset-2 dark:focus:ring-blue-200 dark:focus:ring-offset-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white"
          >
            <p className="dark:text-gray-950 text-gray-50 font-medium text-[14px] leading-5">
              {initialData ? t('Common.Edit') : t('SpeedDial.Create')}
            </p>
            {isLoading && (
              <FontAwesomeIcon
                icon={LoadingIcon}
                className="dark:text-gray-950 text-gray-50 animate-spin"
              />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
