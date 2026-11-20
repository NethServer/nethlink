import { forwardRef, useRef, useState, ReactNode } from 'react'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faCircleCheck as MetIcon,
  faCircleXmark as MissingIcon,
  faCircleXmark as ErrorIcon,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'
import { PasswordPolicy } from '@shared/types'
import {
  getPasswordError,
  getPasswordRequirements,
  PASSWORD_REQUIRED_CLASSES,
  PasswordRequirement,
} from '@renderer/lib/password'

const PasswordField = forwardRef<
  HTMLInputElement,
  {
    id: string
    label: string
    value: string
    autoComplete: string
    error: string
    disabled: boolean
    onChange: (value: string) => void
  }
>(({ id, label, value, autoComplete, error, disabled, onChange }, ref) => {
  const [visible, setVisible] = useState(false)

  return (
    <TextInput
      ref={ref}
      id={id}
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      icon={error ? ErrorIcon : visible ? EyeSlashIcon : EyeIcon}
      iconClassName={error ? 'text-rose-700 dark:text-rose-500' : undefined}
      onIconClick={error ? undefined : () => setVisible(!visible)}
      iconLabel={
        t(visible ? 'Common.Hide password' : 'Common.Show password') as string
      }
      trailingIcon={true}
      autoComplete={autoComplete}
      error={!!error}
      helper={error || undefined}
      disabled={disabled}
    />
  )
})

PasswordField.displayName = 'PasswordField'

const Requirement = ({
  requirement,
  missing,
}: {
  requirement: PasswordRequirement
  missing: boolean
}) => (
  <li className='flex items-center gap-2'>
    {requirement.met ? (
      <FontAwesomeIcon
        icon={MetIcon}
        className='size-4 text-green-700 dark:text-green-500'
        aria-hidden='true'
      />
    ) : missing ? (
      <FontAwesomeIcon
        icon={MissingIcon}
        className='size-4 text-rose-700 dark:text-rose-500'
        aria-hidden='true'
      />
    ) : (
      <span className='size-4 rounded-full border-2 border-gray-500 dark:border-gray-400' />
    )}
    <span>{requirement.label}</span>
  </li>
)

export interface PasswordChangeFormProps {
  // the current password typed in the login form; when missing the form asks
  // for it (password change from the settings)
  currentPassword?: string
  policy: PasswordPolicy | null
  submitLabel?: string
  // rejects with an Error carrying the middleware error message
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>
  onSuccess: (newPassword: string) => void
  onCancel?: () => void
  // 'dialog': the fields scroll between the title and the buttons, which stay
  // at the bottom right as in the other dialogs; 'page' (login): one column
  layout?: 'page' | 'dialog'
  // content shown above the fields, inside the scrolling area of the dialog
  intro?: ReactNode
}

const NO_ERRORS = { current: '', new: '', confirm: '', form: '' }

export const PasswordChangeForm = ({
  currentPassword: loginPassword,
  policy,
  submitLabel,
  onSubmit,
  onSuccess,
  onCancel,
  layout = 'page',
  intro,
}: PasswordChangeFormProps) => {
  const isDialog = layout === 'dialog'
  const askCurrentPassword = loginPassword === undefined
  const [typedCurrentPassword, setTypedCurrentPassword] = useState('')
  const currentPassword = askCurrentPassword
    ? typedCurrentPassword
    : loginPassword
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState(NO_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentRef = useRef<HTMLInputElement>(null)
  const newRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const requirements = getPasswordRequirements(policy, newPassword)
  // missing requirements are highlighted only after a submit
  const metClasses = requirements.classes.filter((c) => c.met).length
  const classesMissing = submitted && metClasses < PASSWORD_REQUIRED_CLASSES

  const showError = (
    field: 'current' | 'new' | 'confirm' | 'form',
    text: string,
  ) => {
    // without the current password field its errors go on top of the form
    if (field === 'current' && !askCurrentPassword) field = 'form'
    setErrors({ ...NO_ERRORS, [field]: text })
    if (field === 'current') currentRef.current?.focus()
    if (field === 'new') newRef.current?.focus()
    if (field === 'confirm') confirmRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSubmitted(true)

    if (askCurrentPassword && !currentPassword) {
      showError('current', t('Password.Enter your current password'))
      return
    }
    if (!requirements.valid) {
      showError(
        'new',
        t('Password.Choose a password that meets all requirements'),
      )
      return
    }
    if (newPassword === currentPassword) {
      showError('new', t("Password.Choose a password you haven't used before"))
      return
    }
    if (confirmPassword !== newPassword) {
      showError('confirm', t('Password.Passwords do not match'))
      return
    }

    setErrors(NO_ERRORS)
    setIsSubmitting(true)
    try {
      await onSubmit(currentPassword, newPassword)
      setIsSubmitting(false)
      // the form goes away: a password manager keeps its menu on the focused field
      ;(document.activeElement as HTMLElement | null)?.blur()
      onSuccess(newPassword)
    } catch (reason: any) {
      setIsSubmitting(false)
      const error = getPasswordError(reason?.message || '')
      showError(error.field, error.text)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={
        isDialog ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col gap-8'
      }
    >
      <div
        className={
          isDialog
            ? 'flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 pb-2 pt-1'
            : 'contents'
        }
      >
        {intro}
        {errors.form && (
          <InlineNotification
            type='error'
            title={t('Password.Cannot update password')}
          >
            <p>{errors.form}</p>
          </InlineNotification>
        )}
        {askCurrentPassword && (
          <PasswordField
            ref={currentRef}
            id='current-password'
            label={t('Password.Current password')}
            value={typedCurrentPassword}
            autoComplete='current-password'
            error={errors.current}
            disabled={isSubmitting}
            onChange={(value) => {
              setTypedCurrentPassword(value)
              if (errors.current) setErrors({ ...errors, current: '' })
            }}
          />
        )}
        <div className='flex flex-col gap-3'>
          <PasswordField
            ref={newRef}
            id='new-password'
            label={t('Password.New password')}
            value={newPassword}
            autoComplete='new-password'
            error={errors.new}
            disabled={isSubmitting}
            onChange={(value) => {
              setNewPassword(value)
              if (errors.new) setErrors({ ...errors, new: '' })
            }}
          />
          {(requirements.length || requirements.classes.length > 0) && (
            <ul className='flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400'>
              {requirements.length && (
                <Requirement
                  requirement={requirements.length}
                  missing={submitted && !requirements.length.met}
                />
              )}
              {requirements.classes.length > 0 && (
                <li>
                  {t('Password.Include at least {{count}} of the following', {
                    count: PASSWORD_REQUIRED_CLASSES,
                  })}
                </li>
              )}
              {requirements.classes.map((requirement) => (
                <Requirement
                  key={requirement.label}
                  requirement={requirement}
                  missing={classesMissing}
                />
              ))}
            </ul>
          )}
        </div>
        <PasswordField
          ref={confirmRef}
          id='confirm-password'
          label={t('Password.Confirm new password')}
          value={confirmPassword}
          autoComplete='new-password'
          error={errors.confirm}
          disabled={isSubmitting}
          onChange={(value) => {
            setConfirmPassword(value)
            if (errors.confirm) setErrors({ ...errors, confirm: '' })
          }}
        />
      </div>
      {isDialog ? (
        <div className='flex shrink-0 justify-end gap-3 px-6 pb-6 pt-5'>
          {onCancel && (
            <Button
              type='button'
              variant='white'
              disabled={isSubmitting}
              onClick={onCancel}
            >
              {t('Common.Cancel')}
            </Button>
          )}
          <Button type='submit' variant='primary' disabled={isSubmitting}>
            {submitLabel || t('Password.Update password')}
            {isSubmitting && (
              <FontAwesomeIcon
                icon={faCircleNotch}
                className='ml-2 size-4 animate-spin'
                aria-hidden='true'
              />
            )}
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          <Button type='submit' variant='primary' disabled={isSubmitting}>
            {submitLabel || t('Password.Update password')}
            {isSubmitting && (
              <FontAwesomeIcon
                icon={faCircleNotch}
                className='ml-2 size-4 animate-spin'
                aria-hidden='true'
              />
            )}
          </Button>
          {onCancel && (
            <Button
              type='button'
              variant='ghost'
              disabled={isSubmitting}
              onClick={onCancel}
              className='w-full justify-center'
            >
              {t('Common.Cancel')}
            </Button>
          )}
        </div>
      )}
    </form>
  )
}
