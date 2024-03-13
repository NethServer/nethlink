import { useState, useEffect } from 'react'
import { Button, TextInput } from './Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { ContactType } from '@shared/types'
import { useForm, SubmitHandler } from 'react-hook-form'
import { t } from 'i18next'

export interface AddToPhonebookBoxProps {
  searchText?: string
  selectedNumber?: string
  selectedCompany?: string
  onCancel: () => void
  handleAddContactToPhonebook: (contact: ContactType) => Promise<void>
}

export function AddToPhonebookBox({
  searchText,
  selectedNumber,
  selectedCompany,
  onCancel,
  handleAddContactToPhonebook
}: AddToPhonebookBoxProps) {
  const {
    register,
    watch,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ContactType>({
    defaultValues: {
      privacy: '',
      type: '',
      name: '',
      company: '',
      speeddial_num: '',
      workphone: '',
      cellphone: '',
      workemail: '',
      notes: ''
    }
  })
  const onSubmit: SubmitHandler<ContactType> = (data) => {
    handleSave(data)
  }
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const watchType = watch('type')

  function containsOnlyNumber(text: string) {
    return /^\d+$/.test(text)
  }

  useEffect(() => {
    reset()
    setValue('privacy', 'public')
    setValue('type', 'person')

    if (searchText !== undefined) {
      if (containsOnlyNumber(searchText)) {
        setValue('speeddial_num', searchText)
      } else {
        setValue('name', searchText)
      }
    }
    //Caso in cui ho selezionato da create in MISSEDCALL
    if (selectedCompany) {
      setValue('company', selectedCompany)
    }
    if (selectedNumber) {
      setValue('speeddial_num', selectedNumber)
    }
  }, [])

  function handleSave(data: ContactType) {
    setIsLoading(true)
    handleAddContactToPhonebook(data)
      .catch((error) => {
        //TODO: gestione errore inserimento
        console.error(error)
      })
      .finally(() => {
        setIsLoading(false)
        reset()
      })
  }

  return (
    <div className="px-4 w-full h-full">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 max-h-[28px]">
        <h1 className="font-semibold">{t('Phonebook.Add to Phonebook')}</h1>
      </div>
      <form
        className="flex flex-col gap-4 p-2 min-h-[240px] h-full overflow-y-auto"
        onSubmit={(e) => {
          handleSubmit(onSubmit)(e)
        }}
      >
        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p>{t('Phonebook.Visibility')}</p>
          <div className="flex flex-row gap-8 items-center">
            <div className="flex flex-row gap-2 items-center">
              <TextInput {...register('privacy')} type="radio" value="public" name="visibility" />
              <p className="whitespace-nowrap">{t('Phonebook.Everybody')}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <TextInput {...register('privacy')} type="radio" value="private" name="visibility" />
              <p className="whitespace-nowrap">{t('Phonebook.Only me')}</p>
            </div>
          </div>
        </label>

        <label className="flex flex-col gap-2 dark:text-gray-50 text-gray-900 font-semibold">
          <p>{t('Phonebook.Type')}</p>
          <div className="flex flex-row gap-8 items-center">
            <div className="flex flex-row gap-2 items-center">
              <TextInput {...register('type')} type="radio" value="person" name="type" />
              <p className="whitespace-nowrap">{t('Phonebook.Person')}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <TextInput {...register('type')} type="radio" value="company" name="type" />
              <p className="whitespace-nowrap">{t('Phonebook.Company')}</p>
            </div>
          </div>
        </label>

        {watchType === 'person' ? (
          <>
            <TextInput
              {...register('name', { required: true })}
              type="text"
              className="font-normal"
              label={t('Phonebook.Name') as string}
              error={Boolean(errors.name)}
            />
          </>
        ) : null}
        <TextInput
          {...register('company', { required: !(watchType === 'person') })}
          type="text"
          className="font-normal"
          label={t('Phonebook.Company') as string}
          error={Boolean(errors.company)}
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

        <TextInput
          {...register('workphone')}
          type="tel"
          minLength={3}
          onChange={(e) => {
            setValue('workphone', e.target.value.replace(/\D/g, ''))
          }}
          className="font-normal"
          label={t('Phonebook.Work phone') as string}
        />

        <TextInput
          {...register('cellphone')}
          type="tel"
          minLength={3}
          onChange={(e) => {
            setValue('cellphone', e.target.value.replace(/\D/g, ''))
          }}
          className="font-normal"
          label={t('Phonebook.Mobile phone') as string}
        />

        <TextInput
          {...register('workemail')}
          type="email"
          className="font-normal"
          label={t('Phonebook.Email') as string}
        />

        <TextInput
          {...register('notes')}
          type="text"
          className="font-normal"
          label={t('Phonebook.Notes') as string}
        />

        <div className="flex flex-row gap-4 justify-end mb-5">
          <Button variant="ghost" onClick={() => onCancel()}>
            <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('Common.Cancel')}</p>
          </Button>
          <Button type="submit" className="dark:bg-blue-500 bg-blue-600 gap-3">
            <p className="dark:text-gray-900 text-gray-50 font-semibold">{t('Common.Save')}</p>
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
