import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { t } from 'i18next'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Backdrop } from '../../Backdrop'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CurstomThemedTooltip'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'

export function SettingsShortcutDialog() {
  const [account, setAccount] = useSharedState('account')
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [combo, setCombo] = useState('')
  const [keysPressed, setKeysPressed] = useState(new Set())

  const ignoredKeys = new Set([
    'Tab',
    'CapsLock',
    'NumLock',
    'ScrollLock',
    'Pause',
    'Insert',
    'Dead',
    'Unidentified',
    'Escape',
    'Shift',
  ])

  const isModifierKey = (key: string) =>
    ['Control', 'Alt', 'Meta'].includes(key)

  const normalizeKey = (key: string): string => {
    switch (key) {
      case 'Control':
        return 'Ctrl'
      case 'Meta':
        return 'Cmd'
      case ' ':
        return 'Space'
      default:
        return key.length === 1 ? key.toUpperCase() : key
    }
  }

  useEffect(() => {
    setFocus('combo')
  }, [])

  useEffect(() => {
    // Use ?? to handle both undefined and empty string correctly
    setCombo(account?.shortcut ?? '')
  }, [account?.shortcut])

  const schema: z.ZodType<{ combo: string }> = z.object({
    combo: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
  })

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm({
    defaultValues: {
      combo: '',
    },
    resolver: zodResolver(schema),
  })

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsShortcutDialogOpen(false)
  }

  function handleClearShortcut() {
    setCombo('')
  }

  async function submit(data) {
    const updatedAccount = { ...account!, shortcut: data.combo }
    setAccount(() => updatedAccount)
    window.electron.send(IPC_EVENTS.CHANGE_SHORTCUT, data.combo)
    setIsShortcutDialogOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const rawKey = e.key
    if (ignoredKeys.has(rawKey)) return

    const newKeys = new Set(keysPressed)

    if (e.ctrlKey) newKeys.add('Ctrl')
    if (e.altKey) newKeys.add('Alt')
    if (e.metaKey) newKeys.add('Cmd')

    if (!isModifierKey(rawKey)) {
      newKeys.add(normalizeKey(rawKey))
    }

    setKeysPressed(newKeys)

    const orderedModifiers = ['Ctrl', 'Alt', 'Cmd']
    const modifiers = orderedModifiers.filter((k) => newKeys.has(k))
    const others = [...newKeys].filter(
      (k) => !orderedModifiers.includes(k as any),
    )
    setCombo([...modifiers, ...others].join('+'))
  }

  const handleKeyUp = () => {
    setKeysPressed(new Set())
  }

  return (
    <>
      {/* Background color */}
      <div className='fixed inset-0 bg-gray-500/75 dark:bg-gray-700/75 z-[201]' />

      {/* On external click close dialog */}
      <Backdrop
        className='z-[202]'
        onBackdropClick={() => setIsShortcutDialogOpen(false)}
      />

      <div className='fixed inset-0 z-[205] overflow-y-auto pointer-events-none'>
        <div className='flex min-h-full items-center justify-center p-4 pointer-events-none'>
        <div className='bg-bgLight dark:bg-bgDark text-bgDark dark:text-bgLight rounded-xl shadow-lg max-w-sm w-[90%] pointer-events-auto'>
          {/* Dialog content */}
          <div className='p-6 flex flex-col gap-4'>
            {/* Title */}
            <h2 className='text-center font-semibold text-xl'>
              {t('TopBar.Keyboard shortcut to call')}
            </h2>

            {/* Subtitle */}
            <p className='text-center text-gray-600 dark:text-gray-300'>
              {t('TopBar.Shortcut title description')}{' '}
            </p>
            {/* Inline notification */}
            {(
              <InlineNotification
                title={t('Common.Warning')}
                type='warning'
                className=''
              >
                <p>{t('TopBar.Shortcut subtitle description')}</p>
              </InlineNotification>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit(submit)}
              className='flex flex-col gap-5'
            >
              {/* Input field with clear button next to it */}
              <div className='flex items-start gap-2'>
                <TextInput
                  {...register('combo')}
                  placeholder={t('Common.Shortcut') as string}
                  className='flex-grow font-normal text-base leading-5 rounded-lg'
                  helper={errors.combo?.message || undefined}
                  error={!!errors.combo?.message}
                  value={combo}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  onChange={() => {}}
                  readOnly
                  autoFocus
                />
                {!!combo && (
                  <Button
                    variant='ghost'
                    onClick={handleClearShortcut}
                    className='mt-3'
                    size='inputSize'
                    data-tooltip-id='tooltip-clear-shortcut'
                    data-tooltip-content={t(
                      'Settings.Clear and remove shortcut',
                    )}
                    data-tooltip-place='top'
                  >
                    <FontAwesomeIcon icon={faXmark} className='h-4 w-4' />
                  </Button>
                )}
                <CustomThemedTooltip id='tooltip-clear-shortcut' place='top' />
              </div>

              {/* Keys not supported info */}
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {t('TopBar.Shortcut body description')}
              </p>

              {/* Action buttons */}
              <div className='flex flex-col gap-3 mt-2'>
                <Button
                  variant='primary'
                  type='button'
                  className='w-full py-3 rounded-lg font-medium'
                  onClick={(e) => {
                    e.preventDefault()
                    submit({ combo })
                  }}
                >
                  {t('Common.Save')}
                </Button>

                <Button
                  variant='ghost'
                  type='button'
                  onClick={handleCancel}
                  className='text-center text-blue-700 dark:text-blue-500 font-medium'
                >
                  {t('Common.Cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
