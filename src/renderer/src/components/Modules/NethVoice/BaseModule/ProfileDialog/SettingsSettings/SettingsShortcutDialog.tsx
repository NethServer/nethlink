import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Modal } from '@renderer/components/Modal'
import { DialogTitle } from '@headlessui/react'
import { parseThemeToClassName } from '@renderer/utils'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'

export function SettingsShortcutDialog() {
  const [account, setAccount] = useSharedState('account')
  const [, setIsShortcutDialogOpen] = useNethlinkData('isShortcutDialogOpen')
  const [theme] = useSharedState('theme')
  const comboInputRef = useRef<HTMLInputElement | null>(null)
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
    ['Control', 'Alt', 'Meta', 'AltGraph'].includes(key)

  const normalizeKey = (key: string): string => {
    switch (key) {
      case 'Control':
        return 'Ctrl'
      case 'Meta':
        return 'Cmd'
      case 'AltGraph':
        return 'AltGr'
      case ' ':
        return 'Space'
      default:
        return key.length === 1 ? key.toUpperCase() : key
    }
  }

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
    // Escape closes the dialog and Tab moves the focus, as in any dialog
    if (e.key === 'Escape' || e.key === 'Tab') return
    e.preventDefault()

    const rawKey = e.key
    if (ignoredKeys.has(rawKey)) return

    const newKeys = new Set(keysPressed)

    const code = (e as any).code as string | undefined
    const hasGetModifierState =
      typeof (e as any).getModifierState === 'function'
    const modifierStateAltGraph = hasGetModifierState
      ? (e as any).getModifierState('AltGraph')
      : false

    const isAltGr =
      rawKey === 'AltGraph' ||
      modifierStateAltGraph ||
      code === 'AltRight' ||
      (code === 'AltRight' && e.ctrlKey)

    if (isAltGr) {
      newKeys.add('AltGr')
    } else {
      if (e.ctrlKey) newKeys.add('Ctrl')
      if (e.altKey) newKeys.add('Alt')
    }

    if (e.metaKey) newKeys.add('Cmd')

    if (!isModifierKey(rawKey)) {
      newKeys.add(normalizeKey(rawKey))
    }

    const orderedModifiers = ['Ctrl', 'Alt', 'AltGr', 'Cmd']
    const modifiers = orderedModifiers.filter((k) => newKeys.has(k))
    const others = [...newKeys].filter(
      (k) => !orderedModifiers.includes(k as any),
    )

    // Require at least one modifier key — reject bare keys like "6", "R", etc.
    if (others.length > 0 && modifiers.length === 0) return

    setKeysPressed(newKeys)
    setCombo([...modifiers, ...others].join('+'))
  }

  const handleKeyUp = () => {
    setKeysPressed(new Set())
  }

  const { ref: comboRegisterRef, ...comboRegister } = register('combo')

  return (
    <Modal
      show={true}
      focus={comboInputRef}
      onClose={() => setIsShortcutDialogOpen(false)}
      themeMode={parseThemeToClassName(theme)}
    >
      <form
        onSubmit={handleSubmit(submit)}
        className='flex max-h-[calc(100vh-2rem)] w-96 max-w-full flex-col gap-6 p-6 text-textPrimaryNeutral dark:text-textPrimaryNeutralDark'
      >
        <div className='flex flex-col gap-2'>
          <DialogTitle className='text-lg font-medium leading-7'>
            {t('TopBar.Call shortcut title')}
          </DialogTitle>
          <p className='text-sm leading-5 text-gray-600 dark:text-gray-400'>
            {t('TopBar.Shortcut title description')}
          </p>
        </div>

        {/* the title and the buttons stay in view: only this part scrolls */}
        <div className='-mx-6 -my-1 flex min-h-0 flex-col gap-6 overflow-y-auto px-6 py-1'>
          <InlineNotification title={t('Common.Warning')} type='warning'>
            <p>{t('TopBar.Shortcut subtitle description')}</p>
          </InlineNotification>

          <div className='flex flex-col gap-2'>
            {/* Input field with clear button next to it */}
            <div className='flex items-start gap-2'>
              <TextInput
                {...comboRegister}
                ref={(el) => {
                  comboRegisterRef(el)
                  comboInputRef.current = el
                }}
                aria-label={t('TopBar.Call shortcut title') as string}
                placeholder={t('Common.Shortcut') as string}
                className='flex-grow'
                helper={errors.combo?.message || undefined}
                error={!!errors.combo?.message}
                value={combo}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onChange={() => {}}
                readOnly
              />
              {!!combo && (
                <Button
                  variant='ghost'
                  onClick={handleClearShortcut}
                  size='inputSize'
                  aria-label={t('Settings.Clear and remove shortcut') as string}
                  data-tooltip-id='tooltip-clear-shortcut'
                  data-tooltip-content={t('Settings.Clear and remove shortcut')}
                  data-tooltip-place='top'
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className='size-4'
                    aria-hidden='true'
                  />
                </Button>
              )}
              <CustomThemedTooltip id='tooltip-clear-shortcut' place='top' />
            </div>

            {/* Keys not supported info */}
            <p className='text-sm leading-5 text-gray-600 dark:text-gray-400'>
              {t('TopBar.Shortcut body description')}
            </p>
          </div>

          {/* as the modals of the design system: cancel, then the primary action, on the right */}
        </div>
        <div className='flex justify-end gap-3'>
          <Button type='button' variant='white' onClick={handleCancel}>
            {t('Common.Cancel')}
          </Button>
          <Button
            type='button'
            onClick={(e) => {
              e.preventDefault()
              submit({ combo })
            }}
          >
            {t('Common.Save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
