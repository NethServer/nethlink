import { useState, useEffect, useMemo, useRef } from 'react'
import { Button, TextInput } from '../../../Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faCheck,
  faCircleInfo,
  faSpinner as LoadingIcon,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { ContactType } from '@shared/types'
import { useForm, SubmitHandler } from 'react-hook-form'
import { t } from 'i18next'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendNotification, validatePhoneNumber } from '@renderer/utils'
import { usePhonebookModule } from './hook/usePhonebookModule'
import { Log } from '@shared/utils/logger'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { usePhonebookSearchModule } from '../SearchResults/hook/usePhoneBookSearchModule'
import { useSharedState, useNethlinkData } from '@renderer/store'
import {
  canWritePhonebookVisibility,
  getAllowedOperatorGroupsIds,
  getPresencePanelPermissions,
  getVisiblePhonebookGroups,
  normalizeSharedGroups,
} from '@shared/phonebook'
import classNames from 'classnames'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CurstomThemedTooltip'
export function AddToPhonebookBox({ close }) {
  const phoneBookSearchModule = usePhonebookSearchModule()
  const phonebookModule = usePhonebookModule()
  const [searchText] = phoneBookSearchModule.searchTextState
  const [selectedContact] = phonebookModule.selectedContact
  const [account] = useSharedState('account')
  const [operators] = useNethlinkData('operators')

  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const sharedGroupsDropdownRef = useRef<HTMLDivElement>(null)
  const baseSchema = z.object({
    privacy: z.string(),
    shared_groups: z.array(z.string()).default([]),
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
  const [isSharedGroupsDropdownOpen, setIsSharedGroupsDropdownOpen] = useState(false)
  const [sharedGroupsError, setSharedGroupsError] = useState('')
  const [visibilityError, setVisibilityError] = useState('')

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
      shared_groups: [],
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
  const watchPrivacy = watch('privacy')
  const selectedGroups = watch('shared_groups') || []
  const profile = account?.data?.profile
  const username = account?.data?.username || account?.username
  const presencePanelPermissions = getPresencePanelPermissions(profile)
  const availableGroups = useMemo(
    () =>
      getVisiblePhonebookGroups(
        getAllowedOperatorGroupsIds(profile),
        operators?.groups,
        presencePanelPermissions?.all_groups?.value,
        username,
      ),
    [operators?.groups, presencePanelPermissions?.all_groups?.value, profile, username],
  )
  const visibilityOptions = useMemo(
    () =>
      [
        {
          id: 'public',
          label: t('Phonebook.Public'),
        },
        {
          id: 'private',
          label: t('Phonebook.Private'),
        },
        {
          id: 'group',
          label: t('Phonebook.Group'),
        },
      ].filter((option) =>
        canWritePhonebookVisibility(profile, option.id as 'public' | 'private' | 'group'),
      ),
    [profile],
  )

  useEffect(() => {
    !!errors.name && trigger('name')
    !!errors.company && trigger('company')
  }, [watchType])

  const onSubmitForm: SubmitHandler<ContactType> = (data) => {
    handleSave(data)
  }

  useEffect(() => {
    setValue('privacy', 'public')
    setValue('shared_groups', [])
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

  useEffect(() => {
    const allowedVisibilityValues = visibilityOptions.map((option) => option.id)
    if (!allowedVisibilityValues.includes(watchPrivacy || '')) {
      setValue('privacy', visibilityOptions[0]?.id || '')
    }
  }, [setValue, visibilityOptions, watchPrivacy])

  useEffect(() => {
    if (watchPrivacy !== 'group') {
      setValue('shared_groups', [])
      setSharedGroupsError('')
      setIsSharedGroupsDropdownOpen(false)
    }
  }, [setValue, watchPrivacy])

  useEffect(() => {
    const visibleSelectedGroups = normalizeSharedGroups(selectedGroups).filter((groupName) =>
      availableGroups.includes(groupName),
    )

    if (visibleSelectedGroups.length !== selectedGroups.length) {
      setValue('shared_groups', visibleSelectedGroups)
    }
  }, [availableGroups, selectedGroups, setValue])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        sharedGroupsDropdownRef.current &&
        !sharedGroupsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSharedGroupsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleSave(data: ContactType) {
    if (!canWritePhonebookVisibility(profile, data.privacy as 'public' | 'private' | 'group')) {
      setVisibilityError(`${t('Phonebook.Cannot create contact')}`)
      return
    }

    setVisibilityError('')
    if (data.privacy === 'group') {
      const normalizedGroups = normalizeSharedGroups(data.shared_groups)
      if (normalizedGroups.length === 0) {
        setSharedGroupsError(`${t('Phonebook.Select at least one group')}`)
        return
      }
      data.shared_groups = normalizedGroups
    }

    setSharedGroupsError('')
    //NETHVOICE uses the value '-' when entering a company that is unnamed
    //data.name === '' can only be true in the case where you enter a company
    setIsLoading(true)
    //Added a timeout to show the spinner as the call is too fast
    setTimeout(() => {
      if (watchType === 'company') {
        data.name = '-'
      }
      phonebookModule
        .handleAddContactToPhonebook(data)
        .then(() => {
          sendNotification(
            t('Notification.contact_created_title'),
            t('Notification.contact_created_description')
          )
          reset()
          close()
        })
        .catch((error) => {
          sendNotification(
            t('Notification.contact_not_created_title'),
            t('Notification.contact_not_created_description')
          )
          Log.warning('error during phonebookModule.handleAddContactToPhonebook:', error)
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

  function toggleSharedGroup(groupName: string) {
    const normalizedGroups = normalizeSharedGroups(selectedGroups)
    const nextGroups = normalizedGroups.includes(groupName)
      ? normalizedGroups.filter((group) => group !== groupName)
      : [...normalizedGroups, groupName]

    setValue('shared_groups', nextGroups, { shouldDirty: true })
    if (nextGroups.length > 0) {
      setSharedGroupsError('')
    }
  }

  return (
    <>
      <ModuleTitle
        title={t('Phonebook.Add to Phonebook')}
      />
      <Scrollable innerClassName={'min-w-[344px]'}>
        <form
          className="flex flex-col gap-5 h-full px-5 pt-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmitForm)(e)
          }}
        >
          <div className="flex flex-col gap-2 dark:text-titleDark text-titleLight">
            <div className="flex items-center">
              <p className="font-medium text-[14px] leading-5">{t('Phonebook.Visibility')}</p>
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="ml-2 h-4 w-4 cursor-help text-textIndigoLight dark:text-textIndigoDark"
                data-tooltip-id="phonebook-visibility-info"
                data-tooltip-content={t('Phonebook.Visibility info')}
              />
              <CustomThemedTooltip id="phonebook-visibility-info" place="right" />
            </div>
            <fieldset>
              <legend className="sr-only">{t('Phonebook.Visibility')}</legend>
              <div className="flex flex-col gap-3">
                {visibilityOptions.map((option) => (
                  <div key={option.id} className="flex flex-row gap-2 items-center">
                    <input
                      {...register('privacy')}
                      id={option.id}
                      type="radio"
                      value={option.id}
                      className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight focus:ring-offset-ringOffsetLight dark:focus:ring-offset-ringOffsetDark"
                    />
                    <label
                      htmlFor={option.id}
                      className="whitespace-nowrap font-normal text-[14px] leading-5"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
            {visibilityError && (
              <p className="text-sm text-red-600 dark:text-red-400">{visibilityError}</p>
            )}
          </div>

          {watchPrivacy === 'group' && (
            <div className="flex flex-col gap-2 dark:text-titleDark text-titleLight">
              <p className="font-medium text-[14px] leading-5">{t('Phonebook.Groups')}</p>
              <div className="relative" ref={sharedGroupsDropdownRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm dark:border-gray-600 dark:bg-bgDark dark:text-titleDark"
                  onClick={() => setIsSharedGroupsDropdownOpen((open) => !open)}
                >
                  <span className="truncate">
                    {t('Phonebook.Choose one or more groups')}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={classNames(
                      'h-4 w-4 transition-transform',
                      isSharedGroupsDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isSharedGroupsDropdownOpen && (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-slate-900">
                    {availableGroups.length > 0 ? (
                      availableGroups.map((groupName) => {
                        const isSelected = selectedGroups.includes(groupName)
                        return (
                          <button
                            key={groupName}
                            type="button"
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-800"
                            onClick={() => toggleSharedGroup(groupName)}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center text-textBlueLight dark:text-textBlueDark">
                              {isSelected && <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />}
                            </span>
                            <FontAwesomeIcon
                              icon={faUsers}
                              className="h-3.5 w-3.5 text-gray-500 dark:text-gray-300"
                            />
                            <span className="truncate">{groupName}</span>
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('Phonebook.No groups available')}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedGroups.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <p className="font-medium text-[14px] leading-5">{t('Phonebook.Selected')}</p>
                  {selectedGroups.map((groupName) => (
                    <span
                      key={groupName}
                      className="inline-flex items-center gap-2 rounded-full bg-textBlueLight/10 px-3 py-1 text-sm font-medium text-textBlueLight dark:bg-textBlueDark/10 dark:text-textBlueDark"
                    >
                      {groupName}
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-textBlueLight/20 dark:hover:bg-textBlueDark/20"
                        aria-label={`${t('Common.Delete')} ${groupName}`}
                        onClick={() => toggleSharedGroup(groupName)}
                      >
                        <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {sharedGroupsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{sharedGroupsError}</p>
              )}
            </div>
          )}

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
          <div className="flex flex-row gap-4 justify-end pb-2">
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
      </Scrollable>
    </>
  )
}
