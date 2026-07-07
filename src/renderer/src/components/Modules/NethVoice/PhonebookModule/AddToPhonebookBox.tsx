import { useState, useEffect, useMemo, useRef } from 'react'
import { Button, MultiSelectCombobox, TextInput } from '../../../Nethesis'
import { Dropdown } from '@renderer/components/Nethesis/dropdown'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAngleRight,
  faCircleInfo,
  faCirclePlus,
  faSpinner as LoadingIcon,
  faUsers,
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
  getVisiblePhonebookGroups,
  normalizeSharedGroups,
} from '@shared/phonebook'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

const PHONE_FIELD_OPTIONS = [
  { key: 'workphone2', labelKey: 'Phonebook.Work phone 2' },
  { key: 'cellphone2', labelKey: 'Phonebook.Mobile phone 2' },
  { key: 'fax', labelKey: 'Phonebook.Fax' },
  { key: 'homephone', labelKey: 'Phonebook.Home phone' },
  { key: 'otherphone', labelKey: 'Phonebook.Other phone' },
]

const EMAIL_FIELD_OPTIONS = [
  { key: 'homeemail', labelKey: 'Phonebook.Home email' },
  { key: 'otheremail', labelKey: 'Phonebook.Other email' },
]

// "Add field" menu: Address, Social (submenu), Website.
const SOCIAL_FIELD_OPTIONS = [
  { key: 'linkedin', labelKey: 'Phonebook.LinkedIn' },
  { key: 'instagram', labelKey: 'Phonebook.Instagram' },
  { key: 'facebook', labelKey: 'Phonebook.Facebook' },
]

export function AddToPhonebookBox({ close }) {
  const phoneBookSearchModule = usePhonebookSearchModule()
  const phonebookModule = usePhonebookModule()
  const [searchText] = phoneBookSearchModule.searchTextState
  const [selectedContact] = phonebookModule.selectedContact
  const [account] = useSharedState('account')
  const [operators] = useNethlinkData('operators')

  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const phoneNumberSchema = z
    .string()
    .trim()
    .regex(/^[0-9*#+]*$/, 'This is not a phone number')

  const baseSchema = z.object({
    privacy: z.string(),
    shared_groups: z.array(z.string()).default([]),
    job: z.string(),
    extension: phoneNumberSchema,
    workphone: phoneNumberSchema,
    workphone2: phoneNumberSchema,
    cellphone: phoneNumberSchema,
    cellphone2: phoneNumberSchema,
    otherphone: phoneNumberSchema,
    fax: phoneNumberSchema,
    homephone: phoneNumberSchema,
    workemail: z.string(),
    otheremail: z.string(),
    homeemail: z.string(),
    facebook: z.string(),
    instagram: z.string(),
    linkedin: z.string(),
    workstreet: z.string(),
    workcity: z.string(),
    workprovince: z.string(),
    workpostalcode: z.string(),
    workcountry: z.string(),
    url: z.string(),
    notes: z.string()
  })

  const resultSchema = z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('person'),
        firstname: z.string().trim(),
        lastname: z.string().trim(),
        company: z.string().trim()
      }),
      z.object({
        type: z.literal('company'),
        firstname: z.string().trim(),
        lastname: z.string().trim(),
        company: z
          .string()
          .trim()
          .min(1, `${t('Common.This field is required')}`)
      })
    ])
    .and(baseSchema)
    .superRefine((data, ctx) => {
      // A person needs at least a first or last name (name is composed from them).
      if (data.type === 'person' && !data.firstname?.trim() && !data.lastname?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['firstname'],
          message: `${t('Common.This field is required')}`
        })
      }
    })

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [sharedGroupsError, setSharedGroupsError] = useState('')
  const [visibilityError, setVisibilityError] = useState('')
  // Optional fields revealed via the "Add …" buttons (progressive disclosure).
  // The inputs stay mounted and only their wrapper is hidden, so react-hook-form
  // keeps their values even while collapsed.
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  const isFieldVisible = (key: string) => visibleFields.has(key)
  const revealField = (key: string) =>
    setVisibleFields((prev) => new Set(prev).add(key))
  const hiddenPhoneFields = PHONE_FIELD_OPTIONS.filter((o) => !isFieldVisible(o.key))
  const hiddenEmailFields = EMAIL_FIELD_OPTIONS.filter((o) => !isFieldVisible(o.key))

  // "Add field" menu (Address / Social flyout / Website): the only one with a nested
  // submenu, so it is hand-rolled (like the CTI) instead of using the generic Dropdown.
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false)
  const [isSocialSubmenuOpen, setIsSocialSubmenuOpen] = useState(false)
  const addFieldDropdownRef = useRef() as React.MutableRefObject<HTMLDivElement>
  // Delayed-close for the Social flyout: moving the pointer across the small gap
  // between the "Social" item and the flyout would otherwise fire mouseLeave and
  // dismiss it before the pointer reaches the panel.
  const socialSubmenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openSocialSubmenu = () => {
    if (socialSubmenuCloseTimer.current) {
      clearTimeout(socialSubmenuCloseTimer.current)
      socialSubmenuCloseTimer.current = null
    }
    setIsSocialSubmenuOpen(true)
  }
  const scheduleCloseSocialSubmenu = () => {
    if (socialSubmenuCloseTimer.current) {
      clearTimeout(socialSubmenuCloseTimer.current)
    }
    socialSubmenuCloseTimer.current = setTimeout(() => {
      setIsSocialSubmenuOpen(false)
      socialSubmenuCloseTimer.current = null
    }, 200)
  }
  useEffect(() => {
    return () => {
      if (socialSubmenuCloseTimer.current) {
        clearTimeout(socialSubmenuCloseTimer.current)
      }
    }
  }, [])

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
      firstname: '',
      lastname: '',
      job: '',
      company: '',
      extension: '',
      workphone: '',
      workphone2: '',
      cellphone: '',
      cellphone2: '',
      otherphone: '',
      fax: '',
      homephone: '',
      workemail: '',
      otheremail: '',
      homeemail: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      workstreet: '',
      workcity: '',
      workprovince: '',
      workpostalcode: '',
      workcountry: '',
      url: '',
      notes: ''
    },
    resolver: zodResolver(resultSchema)
  })

  const watchType = watch('type')
  const watchPrivacy = watch('privacy')
  const selectedGroups = watch('shared_groups') || []
  const normalizedSelectedGroups = useMemo(
    () => normalizeSharedGroups(selectedGroups),
    [selectedGroups],
  )
  const profile = account?.data?.profile
  const username = account?.data?.username || account?.username
  const availableGroups = useMemo(
    () => getVisiblePhonebookGroups(operators?.groups, username),
    [operators?.groups, username],
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
    !!errors.firstname && trigger('firstname')
    !!errors.company && trigger('company')
  }, [errors.company, errors.firstname, trigger, watchType])

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
        setTimeout(() => setFocus('firstname'), 10)
      } else {
        setValue('firstname', searchText)
        setTimeout(() => setFocus('extension'), 10)
      }
    }
    if (selectedContact?.company) {
      setValue('company', selectedContact.company)
      setTimeout(() => setFocus('extension'), 10)
    }
    if (selectedContact?.number) {
      setValue('extension', selectedContact.number)
      setTimeout(() => setFocus('firstname'), 10)
    }
  }, [searchText, selectedContact?.company, selectedContact?.number, setFocus, setValue])

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
    }
  }, [setValue, watchPrivacy])

  useEffect(() => {
    const visibleSelectedGroups = normalizedSelectedGroups.filter((groupName) =>
      availableGroups.includes(groupName),
    )
    const hasChanged =
      visibleSelectedGroups.length !== normalizedSelectedGroups.length ||
      visibleSelectedGroups.some((groupName, index) => groupName !== normalizedSelectedGroups[index])

    if (hasChanged) {
      setValue('shared_groups', visibleSelectedGroups)
    }
  }, [availableGroups, normalizedSelectedGroups, setValue])

  useEffect(() => {
    if (!isAddFieldOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        addFieldDropdownRef.current &&
        !addFieldDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAddFieldOpen(false)
        setIsSocialSubmenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAddFieldOpen])

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
    setIsLoading(true)
    setTimeout(() => {
      // `name` is authoritative (Asterisk resolves the caller on it) and is never
      // edited directly: for persons it is composed from first + last name, for
      // companies it keeps the '-' sentinel.
      if (watchType === 'company') {
        data.name = '-'
      } else {
        data.name = `${data.firstname || ''} ${data.lastname || ''}`.trim()
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

  function handleSharedGroupsChange(nextGroups: string[]) {
    const normalizedGroups = normalizeSharedGroups(nextGroups)

    setValue('shared_groups', normalizedGroups, { shouldDirty: true })
    if (normalizedGroups.length > 0) {
      setSharedGroupsError('')
    }
  }

  return (
    <>
      <ModuleTitle title={t('Phonebook.Create new contact')} />
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
              <MultiSelectCombobox
                options={availableGroups}
                selected={normalizedSelectedGroups}
                onChange={handleSharedGroupsChange}
                optionIcon={faUsers}
                placeholder={String(t('Phonebook.Choose one or more groups') || '')}
                noOptionsText={String(t('Phonebook.No groups available') || '')}
                removeLabel={(groupName) => `${t('Common.Delete')} ${groupName}`}
                error={!!sharedGroupsError}
              />
              {sharedGroupsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{sharedGroupsError}</p>
              )}
            </div>
          )}

          <label className="flex flex-col gap-2 dark:text-titleDark text-titleLight">
            <p className="font-medium text-[14px] leading-5">{t('Phonebook.Type')}</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-2 items-center">
                <input
                  {...register('type')}
                  id="person"
                  type="radio"
                  value="person"
                  name="type"
                  className="h-4 w-4 dark:text-textBlueDark text-textBlueLight dark:focus:ring-ringBlueDark focus:ring-ringBlueLight dark:focus:ring-offset-ringOffsetDark focus:ring-offset-ringOffsetLight"
                />
                <label htmlFor="person" className="whitespace-nowrap font-normal text-[14px] leading-5">
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
                <label htmlFor="company" className="whitespace-nowrap font-normal text-[14px] leading-5">
                  {t('Phonebook.Company')}
                </label>
              </div>
            </div>
          </label>

          {watchType === 'person' ? (
            <>
              <TextInput
                {...register('firstname')}
                type="text"
                label={t('Phonebook.First name') as string}
                placeholder={t('Phonebook.First name placeholder') as string}
                helper={errors.firstname?.message || undefined}
                error={!!errors.firstname?.message}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
              <TextInput
                {...register('lastname')}
                type="text"
                label={t('Phonebook.Last name') as string}
                placeholder={t('Phonebook.Last name placeholder') as string}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
              <TextInput
                {...register('company')}
                type="text"
                label={t('Phonebook.Company') as string}
                helper={errors.company?.message || undefined}
                error={!!errors.company?.message}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
              <div className={isFieldVisible('job') ? '' : 'hidden'}>
                <TextInput
                  {...register('job')}
                  type="text"
                  label={t('Phonebook.Job title') as string}
                  onKeyDown={handlekeyDown}
                  className="font-normal text-[14px] leading-5"
                />
              </div>
              {!isFieldVisible('job') && (
                <Button
                  variant="ghost"
                  type="button"
                  className="gap-3 self-start"
                  onClick={() => revealField('job')}
                >
                  <FontAwesomeIcon
                    icon={faCirclePlus}
                    className="dark:text-textBlueDark text-textBlueLight h-4 w-4"
                  />
                  <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                    {t('Phonebook.Add job title')}
                  </p>
                </Button>
              )}
            </>
          ) : (
            <TextInput
              {...register('company')}
              type="text"
              label={t('Phonebook.Company') as string}
              helper={errors.company?.message || undefined}
              error={!!errors.company?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          )}

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

          <div className={isFieldVisible('workphone2') ? '' : 'hidden'}>
            <TextInput
              {...register('workphone2')}
              type="tel"
              minLength={3}
              label={t('Phonebook.Work phone 2') as string}
              helper={errors.workphone2?.message || undefined}
              error={!!errors.workphone2?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('cellphone2') ? '' : 'hidden'}>
            <TextInput
              {...register('cellphone2')}
              type="tel"
              minLength={3}
              label={t('Phonebook.Mobile phone 2') as string}
              helper={errors.cellphone2?.message || undefined}
              error={!!errors.cellphone2?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('otherphone') ? '' : 'hidden'}>
            <TextInput
              {...register('otherphone')}
              type="tel"
              minLength={3}
              label={t('Phonebook.Other phone') as string}
              helper={errors.otherphone?.message || undefined}
              error={!!errors.otherphone?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('fax') ? '' : 'hidden'}>
            <TextInput
              {...register('fax')}
              type="tel"
              minLength={3}
              label={t('Phonebook.Fax') as string}
              helper={errors.fax?.message || undefined}
              error={!!errors.fax?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('homephone') ? '' : 'hidden'}>
            <TextInput
              {...register('homephone')}
              type="tel"
              minLength={3}
              label={t('Phonebook.Home phone') as string}
              helper={errors.homephone?.message || undefined}
              error={!!errors.homephone?.message}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          {hiddenPhoneFields.length > 0 && (
            <Dropdown
              position="topLeft"
              className="self-start"
              items={
                <>
                  {hiddenPhoneFields.map((o) => (
                    <Dropdown.Item key={o.key} onClick={() => revealField(o.key)}>
                      {t(o.labelKey)}
                    </Dropdown.Item>
                  ))}
                </>
              }
            >
              <Button variant="ghost" type="button" className="gap-3">
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  className="dark:text-textBlueDark text-textBlueLight h-4 w-4"
                />
                <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                  {t('Phonebook.Add phone')}
                </p>
              </Button>
            </Dropdown>
          )}

          <TextInput
            {...register('workemail')}
            type="email"
            label={t('Phonebook.Email') as string}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          <div className={isFieldVisible('homeemail') ? '' : 'hidden'}>
            <TextInput
              {...register('homeemail')}
              type="email"
              label={t('Phonebook.Home email') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('otheremail') ? '' : 'hidden'}>
            <TextInput
              {...register('otheremail')}
              type="email"
              label={t('Phonebook.Other email') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          {hiddenEmailFields.length > 0 && (
            <Dropdown
              position="topLeft"
              className="self-start"
              items={
                <>
                  {hiddenEmailFields.map((o) => (
                    <Dropdown.Item key={o.key} onClick={() => revealField(o.key)}>
                      {t(o.labelKey)}
                    </Dropdown.Item>
                  ))}
                </>
              }
            >
              <Button variant="ghost" type="button" className="gap-3">
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  className="dark:text-textBlueDark text-textBlueLight h-4 w-4"
                />
                <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                  {t('Phonebook.Add email')}
                </p>
              </Button>
            </Dropdown>
          )}

          <TextInput
            {...register('notes')}
            type="text"
            label={t('Phonebook.Notes') as string}
            onKeyDown={handlekeyDown}
            className="font-normal text-[14px] leading-5"
          />

          {/* Company address sub-form */}
          <div className={isFieldVisible('address') ? 'flex flex-col gap-4' : 'hidden'}>
            <TextInput
              {...register('workstreet')}
              type="text"
              label={t('Phonebook.Address') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
            <TextInput
              {...register('workcity')}
              type="text"
              label={t('Phonebook.City') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                {...register('workprovince')}
                type="text"
                label={t('Phonebook.Province') as string}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
              <TextInput
                {...register('workpostalcode')}
                type="text"
                label={t('Phonebook.Postal code') as string}
                onKeyDown={handlekeyDown}
                className="font-normal text-[14px] leading-5"
              />
            </div>
            <TextInput
              {...register('workcountry')}
              type="text"
              label={t('Phonebook.Country') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('linkedin') ? '' : 'hidden'}>
            <TextInput
              {...register('linkedin')}
              type="text"
              label={t('Phonebook.LinkedIn') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('instagram') ? '' : 'hidden'}>
            <TextInput
              {...register('instagram')}
              type="text"
              label={t('Phonebook.Instagram') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('facebook') ? '' : 'hidden'}>
            <TextInput
              {...register('facebook')}
              type="text"
              label={t('Phonebook.Facebook') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          <div className={isFieldVisible('url') ? '' : 'hidden'}>
            <TextInput
              {...register('url')}
              type="text"
              label={t('Phonebook.Website') as string}
              onKeyDown={handlekeyDown}
              className="font-normal text-[14px] leading-5"
            />
          </div>
          {/* "Add field" menu (Address, Social flyout, Website) — opens upward, left-aligned */}
          <div className="relative self-start" ref={addFieldDropdownRef}>
            <Button
              variant="ghost"
              type="button"
              className="gap-3"
              disabled={
                isFieldVisible('address') &&
                isFieldVisible('url') &&
                SOCIAL_FIELD_OPTIONS.every((o) => isFieldVisible(o.key))
              }
              onClick={() =>
                setIsAddFieldOpen((open) => {
                  if (open) {
                    setIsSocialSubmenuOpen(false)
                  }
                  return !open
                })
              }
            >
              <FontAwesomeIcon
                icon={faCirclePlus}
                className="dark:text-textBlueDark text-textBlueLight h-4 w-4"
              />
              <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                {t('Phonebook.Add field')}
              </p>
            </Button>
            {isAddFieldOpen && (
              <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-slate-900">
                {!isFieldVisible('address') && (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-titleLight transition hover:bg-gray-100 dark:text-titleDark dark:hover:bg-slate-800"
                    onClick={() => {
                      revealField('address')
                      setIsAddFieldOpen(false)
                      setIsSocialSubmenuOpen(false)
                    }}
                  >
                    {t('Phonebook.Address')}
                  </button>
                )}
                {SOCIAL_FIELD_OPTIONS.some((o) => !isFieldVisible(o.key)) && (
                  <div
                    className="relative"
                    onMouseEnter={openSocialSubmenu}
                    onMouseLeave={scheduleCloseSocialSubmenu}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-titleLight transition hover:bg-gray-100 dark:text-titleDark dark:hover:bg-slate-800"
                      aria-haspopup="menu"
                      aria-expanded={isSocialSubmenuOpen}
                      onClick={() => (isSocialSubmenuOpen ? setIsSocialSubmenuOpen(false) : openSocialSubmenu())}
                    >
                      <span>{t('Phonebook.Social')}</span>
                      <FontAwesomeIcon icon={faAngleRight} className="h-3 w-3" />
                    </button>
                    {isSocialSubmenuOpen && (
                      <div className="absolute left-full top-0 z-30 w-56 rounded-md border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-slate-900">
                        {SOCIAL_FIELD_OPTIONS.filter((o) => !isFieldVisible(o.key)).map((o) => (
                          <button
                            key={o.key}
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-titleLight transition hover:bg-gray-100 dark:text-titleDark dark:hover:bg-slate-800"
                            onClick={() => {
                              revealField(o.key)
                              setIsSocialSubmenuOpen(false)
                              setIsAddFieldOpen(false)
                            }}
                          >
                            {t(o.labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!isFieldVisible('url') && (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-titleLight transition hover:bg-gray-100 dark:text-titleDark dark:hover:bg-slate-800"
                    onClick={() => {
                      revealField('url')
                      setIsAddFieldOpen(false)
                      setIsSocialSubmenuOpen(false)
                    }}
                  >
                    {t('Phonebook.Website')}
                  </button>
                )}
              </div>
            )}
          </div>
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
