import { useEffect, useRef, useState } from 'react'
import { t } from "i18next"
import { PresenceItem } from './PresenceItem'
import {
  faArrowRight as CallForwardIcon,
  faMobile as CallForwardMobileIcon,
  faVoicemail as VoiceMailIcon
} from '@fortawesome/free-solid-svg-icons'
import { Button, TextInput } from '../../../Nethesis'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getIsPhoneNumber } from '@renderer/lib/utils'
import { log } from '@shared/utils/logger'
import { Account, OperatorData } from '@shared/types'
import { isEmpty } from 'lodash'
import { useStoreState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'

export interface PresenceBoxProps {
  isOpen: boolean,
  onClose: () => void
}
export function PresenceBox({
  isOpen,
  onClose: onClosePresenceDialog
}: PresenceBoxProps) {

  const { saveOperators } = usePhoneIslandEventHandler()
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState<boolean>(false)
  const [account, setAccount] = useStoreState<Account>('account')
  //const [operators, setOperators] = useStoreState<OperatorData>('operators')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const schema: z.ZodType<{ to: string }> = z.object({
    to: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
  })

  function ForwardDialog({ onSubmit }) {

    useEffect(() => {
      setFocus('to')
    }, [])

    const { register, handleSubmit, watch, setError, setFocus, formState: { errors } } = useForm({
      defaultValues: {
        to: ''
      },
      resolver: zodResolver(schema)
    }
    )
    function handleCancel(e) {
      e.preventDefault()
      e.stopPropagation()
      setIsForwardDialogOpen(false)
      onClosePresenceDialog()
    }

    async function submit(data) {
      log("submit presence", data)
      if (!getIsPhoneNumber(data.to)) {
        setError('to', {
          message: t('Common.This is not a phone number') as string
        })
      } else {
        try {
          await onSubmit(data)

        } catch (e) {
          log('ERROR ON PRESENCE CHANGE', e)

        } finally {

          setIsForwardDialogOpen(false)
          onClosePresenceDialog()
        }
      }
    }

    const to = watch('to')

    return <div className='absolute top-[72px] left-0 z-[203]'>
      <div className=' bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-lg m-8 p-0 '>
        <div className='p-4  flex flex-col gap-2'>
          <div>
            {t('TopBar.Enter phone number for call forward')}
          </div>
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
        <div className='flex flex-row justify-end gap-2 dark:bg-gray-800 p-2 w-full rounded-b-lg'>
          <Button variant='white' onClick={handleCancel}>{t('Common.Cancel')}</Button>
          <Button variant='primary' type='button' onClick={(e) => {
            e.preventDefault()
            submit({ to })
          }}>{t('Common.Save')}</Button>
        </div>
      </div>
    </div>
  }

  function Backdrop({ onBackdropClick, z, background }) {
    return (
      <div className={`absolute w-[100vw] h-[100%] rounded-b-lg ${background} z-[${z}] top-0 left-0`} onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onBackdropClick()
      }}></div>
    )
  }

  async function onSelectPresence(status, to: string | undefined = undefined) {
    try {
      await NethVoiceAPI.User.setPresence(status, to)
      const me = await NethVoiceAPI.User.me()
      if (to) {
        const operators = await NethVoiceAPI.fetchOperators()
        log('operators', operators)
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
      log('ERROR ON PRESENCE CHANGE', e)
    } finally {
      onClosePresenceDialog()
    }
  }

  return isOpen && (
    <>
      <div className='absolute left-12 top-[66px] w-[280px] bg-bgLight dark:bg-bgDark border rounded-lg z-[202] py-3 dark:border-borderDark border-borderLight '>
        <PresenceItem onClick={onSelectPresence} status='online' presenceName={t('TopBar.Online')} presenceDescription={t('TopBar.Make and receive phone calls')} ></PresenceItem>
        {/* check callforward permission */}
        {account?.data?.profile?.macro_permissions?.settings?.permissions?.call_forward
          ?.value && (
            <PresenceItem onClick={() => setIsForwardDialogOpen(true)} status='callforward' presenceName={t('TopBar.Call forward')} presenceDescription={t('TopBar.Forward incoming calls to another phone number')} icon={CallForwardIcon}></PresenceItem>
          )}
        {!isEmpty(account?.data?.endpoints.cellphone) && <PresenceItem onClick={() => onSelectPresence('callforward', account!.data!.endpoints.cellphone[0]!.id)} status='callforward' presenceName={t('TopBar.Mobile')} presenceDescription={t('TopBar.Do not receive any calls')} hasTopBar={true} icon={CallForwardMobileIcon}></PresenceItem>}
        {!isEmpty(account?.data?.endpoints.voicemail) && <PresenceItem onClick={() => onSelectPresence('voicemail')} status='voicemail' presenceName={t('TopBar.Voicemail')} presenceDescription={t('TopBar.Activate voicemail')} hasTopBar={true} icon={VoiceMailIcon}></PresenceItem>}
        {/* check dnd permission */}
        {account?.data?.profile?.macro_permissions?.settings?.permissions?.dnd?.value && (
          <PresenceItem onClick={onSelectPresence} status='dnd' presenceName={t('TopBar.Do not disturb')} presenceDescription={t('TopBar.Do not receive any calls')} hasTopBar={true}></PresenceItem>
        )
        }
      </div >
      <Backdrop onBackdropClick={onClosePresenceDialog} z={201} background={'bg-transparent'} />
      {
        isForwardDialogOpen && <>
          <ForwardDialog onSubmit={(data) => {
            onSelectPresence('callforward', data.to)
          }} />
          <Backdrop onBackdropClick={() => setIsForwardDialogOpen(false)} z={202} background={'bg-white opacity-[0.25]'} />
        </>
      }
    </>
  )

}
