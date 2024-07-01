import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextInput } from '../../../Nethesis'
import { faSpinner as LoadingIcon } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useRef, useState } from 'react'
import { NewContactType, ContactType, NewSpeedDialType } from '@shared/types'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useForm, SubmitHandler } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSpeedDialsModule } from './hook/useSpeedDialsModule'
import { sendNotification } from '@renderer/utils'
import { Scrollable } from '@renderer/components/Scrollable'

type SpeedDialFormBoxData = {
  name: string
  speeddial_num: string
}

export function SpeedDialFormBox({ close }) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const speedDialModule = useSpeedDialsModule()
  const [selectedSpeedDial, setSelectedSpeedDial] = speedDialModule.speedDialsState
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
      .min(3, `${t('Common.This field must be at least', { number: '2' })}`)
      .regex(/^[0-9*#+]*$/, `${t('Common.This is not a phone number')}`)
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactType>({
    resolver: zodResolver(schema)
  })

  const onSubmitForm: SubmitHandler<ContactType> = (data) => {
    handleSave(data)
  }

  const handleClose = () => {
    reset()
    close()
  }

  useEffect(() => {
    reset(selectedSpeedDial)
  }, [selectedSpeedDial])

  function handleSave(data: ContactType) {
    setIsLoading(true)
    speedDialModule
      .upsertSpeedDial(data)
      .then(() => {
        if (selectedSpeedDial) {
          sendNotification(
            t('Notification.speeddial_modified_title'),
            t('Notification.speeddial_modified_description')
          )
        } else {
          sendNotification(
            t('Notification.speeddial_created_title'),
            t('Notification.speeddial_created_description')
          )
        }
        reset()
        close()
      })
      .catch((error) => {
        if (selectedSpeedDial) {
          sendNotification(
            t('Notification.speeddial_not_modified_title'),
            t('Notification.speeddial_not_modified_description')
          )
        } else {
          sendNotification(
            t('Notification.speeddial_not_created_title'),
            t('Notification.speeddial_not_created_description')
          )
        }
        log(error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }
  //${errors.name?.message ? '' :

  return (
    <Scrollable innerClassName={' max-w-[344px]'}>
      <div className="flex flex-col gap-3 h-full relative">
        <div className="h-full w-full">
          <div className="px-5">
            <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] mt-3">
              <h1 className="font-medium text-[14px] leading-5 dark:text-titleDark text-titleLight">
                {selectedSpeedDial
                  ? t('SpeedDial.Edit speed dial')
                  : t('SpeedDial.Create speed dial')}
              </h1>
            </div>
          </div>

          <form
            className="flex flex-col gap-5 h-full max-h-[220px] px-5 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(onSubmitForm)(e)
            }}
          >
            <TextInput
              {...register('name', { required: true })}
              autoFocus={true}
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
              className="font-medium text-[14px] leading-5"
            />
            <TextInput
              {...register('speeddial_num', { required: true })}
              type="tel"
              minLength={2}
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
              className="font-medium text-[14px] leading-5"
            />
            <div className="relative w-full flex flex-row justify-end gap-4 pb-2">
              <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
                  {t('Common.Cancel')}
                </p>
              </Button>
              <Button type="submit" ref={submitButtonRef} className="gap-3">
                <p className="dark:text-titleLight text-titleDark font-medium text-[14px] leading-5">
                  {selectedSpeedDial ? t('Common.Edit') : t('SpeedDial.Create')}
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
    </Scrollable>
  )
}
