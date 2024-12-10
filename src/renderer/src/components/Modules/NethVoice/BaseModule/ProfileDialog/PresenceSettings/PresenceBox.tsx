import { useEffect, useState } from 'react'
import { t } from 'i18next'
import { PresenceItem } from './PresenceItem'
import {
  faArrowRight as CallForwardIcon,
  faMobile as CallForwardMobileIcon,
  faVoicemail as VoiceMailIcon
} from '@fortawesome/free-solid-svg-icons'
import { Button, TextInput } from '../../../../../Nethesis'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getIsPhoneNumber } from '@renderer/lib/utils'
import { Log } from '@shared/utils/logger'
import { isEmpty } from 'lodash'
import { useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Scrollable } from '@renderer/components/Scrollable'
import classNames from 'classnames'
import { useAccount } from '@renderer/hooks/useAccount'
import { PERMISSION } from '@shared/constants'

export function PresenceBox() {
  const { saveOperators } = usePhoneIslandEventHandler()
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState<boolean>(false)
  const [account, setAccount] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const { hasPermission } = useAccount()

  const schema: z.ZodType<{ to: string }> = z.object({
    to: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`)
  })

  function ForwardDialog({ onSubmit }) {
    useEffect(() => {
      setFocus('to')
    }, [])

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
      <div className='absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-[205]'>
        <div className=" bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-lg m-8 p-0 ">
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

  function Backdrop({ onBackdropClick, className }) {
    return (
      <div
        className={classNames(`absolute w-[100vw] h-[100%] rounded-b-lg top-0 left-0`, className)}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onBackdropClick()
        }}
      ></div>
    )
  }

  async function onSelectPresence(status, to: string | undefined = undefined) {
    try {
      await NethVoiceAPI.User.setPresence(status, to)
      const me = await NethVoiceAPI.User.me()
      if (to) {
        const operators = await NethVoiceAPI.fetchOperators()
        saveOperators(operators)
      }
      setAccount({
        ...account!,
        data: {
          ...account!.data!,
          ...me
        }
      })
    } catch (e) {
      Log.error('ON PRESENCE CHANGE', e)
    } finally {
    }
  }

  return (
    <div>
      <PresenceItem
        onClick={onSelectPresence}
        status="online"
        presenceName={t('TopBar.Online')}
        presenceDescription={t('TopBar.Make and receive phone calls')}
      ></PresenceItem>
      {/* check callforward permission */}
      {hasPermission(PERMISSION.CALL_FORWARD) && (
        <PresenceItem
          onClick={() => setIsForwardDialogOpen(true)}
          status="callforward"
          presenceName={t('TopBar.Call forward')}
          presenceDescription={t('TopBar.Forward incoming calls to another phone number')}
          icon={CallForwardIcon}
        ></PresenceItem>
      )}
      {!isEmpty(account?.data?.endpoints.cellphone) && (
        <PresenceItem
          onClick={() =>
            onSelectPresence('callforward', account!.data!.endpoints.cellphone[0]!.id)
          }
          status="callforward"
          presenceName={t('TopBar.Mobile')}
          presenceDescription={t('TopBar.Do not receive any calls')}
          icon={CallForwardMobileIcon}
        ></PresenceItem>
      )}
      {!isEmpty(account?.data?.endpoints.voicemail) && (
        <PresenceItem
          onClick={() => onSelectPresence('voicemail')}
          status="voicemail"
          presenceName={t('TopBar.Voicemail')}
          presenceDescription={t('TopBar.Activate voicemail')}
          icon={VoiceMailIcon}
        ></PresenceItem>
      )}
      {/* check dnd permission */}
      {hasPermission(PERMISSION.DND) && (
        <PresenceItem
          onClick={onSelectPresence}
          status="dnd"
          presenceName={t('TopBar.Do not disturb')}
          presenceDescription={t('TopBar.Do not receive any calls')}
          hasTopBar={true}
        ></PresenceItem>
      )}

      {isForwardDialogOpen && (
        <div className=' top-0 left-0'>
          <ForwardDialog
            onSubmit={(data) => {
              onSelectPresence('callforward', data.to)
            }}
          />
          <Backdrop
            onBackdropClick={() => setIsForwardDialogOpen(false)}
            className={'bg-white opacity-[0.25] z-[204]'}
          />
        </div>
      )}
    </div>
  )
}
