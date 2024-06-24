import { useState, useEffect, useRef } from 'react'
import { Button, TextInput } from '../../../Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner as LoadingIcon } from '@fortawesome/free-solid-svg-icons'
import { ContactType } from '@shared/types'
import { useForm, SubmitHandler } from 'react-hook-form'
import { t } from 'i18next'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendNotification, validatePhoneNumber } from '@renderer/utils'
import { usePhonebookSearchModule } from '../../SearchResults/hook/usePhoneBookSearchModule'
import { useLastCallsModule } from '../LastCalls/hook/useLastCallsModule'
import { usePhonebookModule } from './hook/usePhonebookModule'
import { log } from '@shared/utils/logger'

export function AddToPhonebookBox({ close }) {

  const phoneBookSearchModule = usePhonebookSearchModule()
  const phonebookModule = usePhonebookModule()
  const [searchText] = phoneBookSearchModule.searchTextState
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact

  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const baseSchema = z.object({
    privacy: z.string(),
    extension: z
      .string()
      .trim()
      .regex(/^[0-9*#+]*$/, 'This is not a phone number'),
    workphone: z
      .string()
      .trim()
      .regex(/^[0-9*#+]*$/, 'This is not a phone number'),
    cellphone: z
      .string()
      .trim()
      .regex(/^[0-9*#+]*$/, 'This is not a phone number'),
    workemail: z.string(),
    notes: z.string()
  })

  const resultSchema = z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('person'),
        name: z
          .string()
          .trim()
          .min(1, `${t('Common.This field is required')}`),
        company: z.string().trim()
      }),
      z.object({
        type: z.literal('company'),
        name: z.string().trim(),
        company: z
          .string()
          .trim()
          .min(1, `${t('Common.This field is required')}`)
      })
    ])
    .and(baseSchema)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    register,
    watch,
    handleSubmit,
    setFocus,
    setValue,
    reset,
    trigger,
    formState: { errors }
  } = useForm<ContactType>({
    defaultValues: {
      privacy: '',
      type: '',
      name: '',
      company: '',
      extension: '',
      workphone: '',
      cellphone: '',
      workemail: '',
      notes: ''
    },
    resolver: zodResolver(resultSchema)
  })

  const watchType = watch('type')

  useEffect(() => {
    !!errors.name && trigger('name')
    !!errors.company && trigger('company')
  }, [watchType])

  const onSubmitForm: SubmitHandler<ContactType> = (data) => {
    handleSave(data)
  }

  useEffect(() => {
    setValue('privacy', 'public')
    setValue('type', 'person')

    if (searchText != undefined) {
      if (validatePhoneNumber(searchText)) {
        setValue('extension', searchText)
        setTimeout(() => setFocus('name'), 10)
      } else {
        setValue('name', searchText)
        setTimeout(() => setFocus('extension'), 10)
      }
    }
    //Caso in cui ho selezionato da create in MISSEDCALL
    if (selectedContact?.company) {
      setValue('company', selectedContact.company)
      setTimeout(() => setFocus('extension'), 10)
    }
    if (selectedContact?.number) {
      setValue('extension', selectedContact.number)
      setTimeout(() => setFocus('name'), 10)
    }
  }, [])

  function handleSave(data: ContactType) {
    //NETHVOICE uses the value '-' when entering a company that is unnamed
    //data.name === '' can only be true in the case where you enter a company
    setIsLoading(true)
    //Added a timeout to show the spinner as the call is too fast
    setTimeout(() => {
      if (watchType === 'company') {
        data.name = '-'
      }
      phonebookModule.handleAddContactToPhonebook(data)
        .then(() => {
          sendNotification(
            t('Notification.contact_created_title'),
            t('Notification.contact_created_description')
          )
          reset()
          close()
        }).catch((error) => {
          sendNotification(
            t('Notification.contact_not_created_title'),
            t('Notification.contact_not_created_description')
          )
          log(error)
          close()
          reset()
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 300)
  }

  function handleCancel(): void {
    reset()
    close()
  }

  const handlekeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitButtonRef.current?.focus()
      handleSubmit(onSubmitForm)(e)
    }
  }

  return (
    <div className="absolute top-0 left-0 z-[100] dark:bg-bgDark bg-bgLight h-full w-full rounded-bl-lg" >
      <div className="w-full h-full">
        <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] px-5">
          <h1 className="font-medium text-[14px] leading-5 dark:text-titleDark text-titleLight">
            {t('Phonebook.Add to Phonebook')}
          </h1>
        </div>
        <form
          className="flex flex-col gap-5 p-2 h-full overflow-y-auto max-h-[240px] px-5"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmitForm)(e)
          }}
        >
          <label className="flex flex-col gap-2 dark:text-titleDark text-titleLight">
            <p className="font-medium text-[14px] leading-5">{t('Phonebook.Visibility')}</p>
            <div className="flex flex-row gap-8 items-center">
              <div className="flex flex-row gap-2 items-center">
                <input
                  {...register('privacy')}
                  id="public"
                  type="radio"
                  value="public"
                  name="visibility"
                  className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight  focus:ring-offset-ringOffsetLight dark:focus:ring-offset-ringOffsetDark"
                />
                <label
                  htmlFor="public"
                  className="whitespace-nowrap font-normal text-[14px] leading-5"
                >
                  {t('Phonebook.All')}
                </label>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <input
                  {...register('privacy')}
                  id="private"
                  type="radio"
                  value="private"
                  name="visibility"
                  className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight dark:focus:ring-offset-ringOffsetDark focus:ring-offset-ringOffsetLight"
                />
                <label
                  htmlFor="private"
                  className="whitespace-nowrap font-normal text-[14px] leading-5"
                >
                  {t('Phonebook.Only me')}
                </label>
              </div>
            </div>
          </label>

          <label className="flex flex-col gap-2 dark:text-titleDark text-titleLight">
            <p className="font-medium text-[14px] leading-5">{t('Phonebook.Type')}</p>
            <div className="flex flex-row gap-8 items-center">
              <div className="flex flex-row gap-2 items-center">
                <input
                  {...register('type')}
                  id="person"
                  type="radio"
                  value="person"
                  name="type"
                  className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight dark:focus:ring-offset-ringOffsetDark focus:ring-offset-ringOffsetLight"
                />
                <label
                  htmlFor="person"
                  className="whitespace-nowrap font-normal text-[14px] leading-5"
                >
                  {t('Phonebook.Person')}
                </label>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <input
                  {...register('type')}
                  id="company"
                  type="radio"
                  value="company"
                  name="type"
                  className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight dark:focus:ring-offset-ringOffsetDark focus:ring-offset-ringOffsetLight"
                />
                <label
                  htmlFor="company"
                  className="whitespace-nowrap font-normal text-[14px] leading-5"
                >
                  {t('Phonebook.Company')}
                </label>
              </div>
            </div>
          </label>

          {watchType === 'person' ? (
            <>
              <TextInput
                {...register('name')}
                type="text"
                label={t('Phonebook.Name') as string}
                helper={errors.name?.message || undefined}
                error={!!errors.name?.message}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
            </>
          ) : null}
          <TextInput
            {...register('company')}
            type="text"
            label={t('Phonebook.Company') as string}
            helper={errors.company?.message || undefined}
            error={!!errors.company?.message}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <TextInput
            {...register('extension')}
            type="tel"
            minLength={3}
            label={t('Phonebook.Phone number') as string}
            helper={errors.extension?.message || undefined}
            error={!!errors.extension?.message}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <TextInput
            {...register('workphone')}
            type="tel"
            minLength={3}
            label={t('Phonebook.Work phone') as string}
            helper={errors.workphone?.message || undefined}
            error={!!errors.workphone?.message}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <TextInput
            {...register('cellphone')}
            type="tel"
            minLength={3}
            label={t('Phonebook.Mobile phone') as string}
            helper={errors.cellphone?.message || undefined}
            error={!!errors.cellphone?.message}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <TextInput
            {...register('workemail')}
            type="email"
            label={t('Phonebook.Email') as string}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <TextInput
            {...register('notes')}
            type="text"
            label={t('Phonebook.Notes') as string}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <div className="flex flex-row gap-4 justify-end mb-1">
            <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
              <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                {t('Common.Cancel')}
              </p>
            </Button>
            <Button type="submit" ref={submitButtonRef} className="gap-3">
              <p className="dark:text-titleLight text-titleDark font-medium text-[14px] leading-5">
                {t('Common.Save')}
              </p>
              {isLoading && (
                <FontAwesomeIcon
                  icon={LoadingIcon}
                  className="dark:text-titleLight text-titleDark animate-spin"
                />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
