import { forwardRef, useRef, useState } from 'react'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faCircleCheck as MetIcon,
  faCircleXmark as MissingIcon,
  faCircleExclamation as ErrorIcon,
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
        className='h-4 w-4 text-green-700 dark:text-green-500'
      />
    ) : missing ? (
      <FontAwesomeIcon
        icon={MissingIcon}
        className='h-4 w-4 text-rose-700 dark:text-rose-500'
      />
    ) : (
      <span className='h-4 w-4 rounded-full border-[1.5px] border-gray-500 dark:border-gray-400' />
    )}
    <span>{requirement.label}</span>
  </li>
)

export interface PasswordChangeFormProps {
  // the current password, typed in the login form
  currentPassword: string
  policy: PasswordPolicy | null
  // rejects with an Error carrying the middleware error message
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>
  onSuccess: () => void
}

export const PasswordChangeForm = ({
  currentPassword,
  policy,
  onSubmit,
  onSuccess,
}: PasswordChangeFormProps) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({ new: '', confirm: '', form: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const newRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const requirements = getPasswordRequirements(policy, newPassword)
  // missing requirements are highlighted only after a submit
  const metClasses = requirements.classes.filter((c) => c.met).length
  const classesMissing = submitted && metClasses < PASSWORD_REQUIRED_CLASSES

  const showError = (field: 'new' | 'confirm' | 'form', text: string) => {
    setErrors({ new: '', confirm: '', form: '', [field]: text })
    if (field === 'new') newRef.current?.focus()
    if (field === 'confirm') confirmRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSubmitted(true)

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

    setErrors({ new: '', confirm: '', form: '' })
    setIsSubmitting(true)
    try {
      await onSubmit(currentPassword, newPassword)
      setIsSubmitting(false)
      onSuccess()
    } catch (reason: any) {
      setIsSubmitting(false)
      const error = getPasswordError(reason?.message || '')
      showError(error.field, error.text)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='flex flex-col gap-8'>
      {errors.form && (
        <InlineNotification
          type='error'
          title={t('Password.Cannot update password')}
        >
          <p>{errors.form}</p>
        </InlineNotification>
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
      <Button type='submit' variant='primary' disabled={isSubmitting}>
        {t('Password.Update password')}
        {isSubmitting && (
          <FontAwesomeIcon icon={faCircleNotch} className='fa-spin ml-2' />
        )}
      </Button>
    </form>
  )
}
