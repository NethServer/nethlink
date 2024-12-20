import { zodResolver } from "@hookform/resolvers/zod"
import { Button, TextInput } from "@renderer/components/Nethesis"
import { getIsPhoneNumber } from "@renderer/lib/utils"
import { useNethlinkData } from "@renderer/store"
import { Log } from "@shared/utils/logger"
import { t } from "i18next"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { usePresenceService } from "./usePresenceService"

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
      .min(1, `${t('Common.This field is required')}`)
  })

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors }
  } = useForm({
    defaultValues: {
      to: ''
    },
    resolver: zodResolver(schema)
  })
  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsForwardDialogOpen(false)
  }

  async function submit(data) {
    if (!getIsPhoneNumber(data.to)) {
      setError('to', {
        message: t('Common.This is not a phone number') as string
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
    <div className='absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-[205] pointer-events-none'>
      <div className=" bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-lg m-8 p-0 pointer-events-auto">
        <div className="p-4  flex flex-col gap-2">
          <div>{t('TopBar.Enter phone number for call forward')}</div>
          <div>
            <form onSubmit={handleSubmit(submit)}>
              <TextInput
                {...register('to')}
                placeholder={t('Common.Phone number') as string}
                className="font-normal text-[14px] leading-5"
                helper={errors.to?.message || undefined}
                error={!!errors.to?.message}
              />
            </form>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-2 dark:bg-gray-800 p-2 w-full rounded-b-lg">
          <Button variant="white" onClick={handleCancel}>
            {t('Common.Cancel')}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              submit({ to })
            }}
          >
            {t('Common.Save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
