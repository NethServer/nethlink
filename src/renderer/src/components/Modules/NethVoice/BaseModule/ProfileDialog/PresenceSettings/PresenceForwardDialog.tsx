import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { getIsPhoneNumber } from '@renderer/lib/utils'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePresenceService } from './usePresenceService'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { parseThemeToClassName } from '@renderer/utils'

export function PresenceForwardDialog() {
  const [, setIsForwardDialogOpen] = useNethlinkData('isForwardDialogOpen')
  const [theme] = useSharedState('theme')
  const { onSelectPresence } = usePresenceService()
  useEffect(() => {
    setFocus('to')
  }, [])

  const onSubmit = (data) => {
    onSelectPresence('callforward', data.to)
  }

  const schema: z.ZodType<{ to: string }> = z.object({
    to: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
  })

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors },
  } = useForm({
    defaultValues: {
      to: '',
    },
    resolver: zodResolver(schema),
  })

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsForwardDialogOpen(false)
  }

  async function submit(data) {
    if (!getIsPhoneNumber(data.to)) {
      setError('to', {
        message: t('Common.This is not a phone number') as string,
      })
    } else {
      try {
        await onSubmit(data)
      } catch (e) {
        Log.warning('error during the presence change', e)
      } finally {
        setIsForwardDialogOpen(false)
      }
    }
  }

  const to = watch('to')

  return (
    // no initial focus button: the focus goes to the phone number field
    <Modal
      show={true}
      onClose={() => setIsForwardDialogOpen(false)}
      themeMode={parseThemeToClassName(theme)}
    >
      <form
        onSubmit={handleSubmit(submit)}
        className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col gap-6 p-6 text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'
      >
        <div className='flex flex-col gap-2'>
          <DialogTitle className='text-lg font-medium leading-7'>
            {t('TopBar.Call forward')}
          </DialogTitle>
          <p className='text-sm leading-5 text-gray-600 dark:text-gray-400'>
            {t('TopBar.Forward incoming calls to another phone number')}
          </p>
        </div>
        {/* the title and the buttons stay in view: only this part scrolls */}
        <div className='-mx-6 -my-1 flex min-h-0 flex-col gap-6 overflow-y-auto px-6 py-1'>
          <TextInput
            {...register('to')}
            placeholder={t('Common.Phone number') as string}
            aria-label={t('Common.Phone number') as string}
            className='w-full'
            helper={errors.to?.message || undefined}
            error={!!errors.to?.message}
            autoFocus
          />
        </div>
        {/* as the modals of the design system: cancel, then the primary action, on the right */}
        <div className='flex justify-end gap-3'>
          <Button type='button' variant='white' onClick={handleCancel}>
            {t('Common.Cancel')}
          </Button>
          <Button
            type='submit'
            onClick={(e) => {
              e.preventDefault()
              submit({ to })
            }}
          >
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
