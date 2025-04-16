import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { getIsPhoneNumber } from '@renderer/lib/utils'
import { useNethlinkData } from '@renderer/store'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { usePresenceService } from './usePresenceService'
import { Backdrop } from '../../Backdrop'

export function PresenceForwardDialog() {
  const [, setIsForwardDialogOpen] = useNethlinkData('isForwardDialogOpen')
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
    <>
      {/* Background color */}
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />

      {/* On external click close dialog */}
      <Backdrop
        className='z-[202]'
        onBackdropClick={() => setIsForwardDialogOpen(false)}
      />

      <div className='absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-[205] pointer-events-none'>
        <div className='bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-xl shadow-lg max-w-sm w-[90%] pointer-events-auto'>
          {/* Dialog content */}
          <div className='p-6 flex flex-col gap-6'>
            {/* Title */}
            <h3 className='text-center font-medium text-lg'>
              {t('TopBar.Enter phone number for call forward')}
            </h3>

            {/* Form */}
            <form
              onSubmit={handleSubmit(submit)}
              className='flex flex-col gap-6'
            >
              {/* Input field */}
              <div>
                <TextInput
                  {...register('to')}
                  placeholder={t('Common.Phone number') as string}
                  className='w-full font-normal text-base leading-5 rounded-lg'
                  helper={errors.to?.message || undefined}
                  error={!!errors.to?.message}
                  autoFocus
                />
              </div>

              {/* Action buttons */}
              <div className='flex flex-col gap-4'>
                <Button
                  variant='primary'
                  type='button'
                  className='w-full py-3 rounded-lg font-medium'
                  onClick={(e) => {
                    e.preventDefault()
                    submit({ to })
                  }}
                >
                  {t('Common.Save')}
                </Button>
                <Button
                  variant='ghost'
                  className='text-center font-medium text-blue-700 dark:text-blue-500'
                  onClick={handleCancel}
                >
                  {t('Common.Cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
