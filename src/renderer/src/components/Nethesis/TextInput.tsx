// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 *
 * It renders an input fields.
 *
 * @param label - The label to render.
 * @param placeholder - The placeholder to render.
 * @param icon - The icon to show.
 * @param iconRight - The position of the icon.
 * @param error - The position of the icon.
 * @param helper - The text of the helper.
 * @param size - The size of the input.
 * @param squared - The radius of the border.
 * @param onIconClick - The callback on icon click.
 * @param clearable - Whether to show a clear button when input has value
 * @param onClear - Callback when clear button is clicked
 */

import { ComponentProps, forwardRef } from 'react'
import { cleanClassName } from '../../lib/utils'
import { useTheme } from '../../theme/Context'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { Button } from './Button'

export interface TextInputProps
  extends Omit<ComponentProps<'input'>, 'ref' | 'color' | 'size'> {
  label?: string
  placeholder?: string
  icon?: IconDefinition
  trailingIcon?: boolean
  error?: boolean
  helper?: string
  size?: 'base' | 'large'
  rounded?: 'base' | 'full'
  squared?: 'left' | 'right' | 'top' | 'bottom'
  onIconClick?: () => void
  clearable?: boolean
  onClear?: () => void
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      icon: Icon,
      trailingIcon,
      type = 'text',
      error,
      helper,
      size,
      rounded,
      squared,
      onIconClick,
      clearable,
      onClear,
      id,
      className,
      value,
      ...props
    },
    ref,
  ) => {
    const cleanProps = cleanClassName(props)
    const { input: theme } = useTheme().theme

    const hasValue = value !== undefined && value !== null && value !== ''
    const showClearButton = clearable && hasValue

    return (
      <div className={classNames('text-left', 'w-full', className)}>
        {label && (
          <label className={theme.label} htmlFor={id}>
            {label}
          </label>
        )}
        <div className='relative'>
          {Icon && (
            <div
              className={classNames(
                theme.icon.base,
                trailingIcon ? theme.icon.right : theme.icon.left,
              )}
            >
              <FontAwesomeIcon
                icon={Icon}
                className={classNames(
                  size === 'large'
                    ? theme.icon.size.large
                    : theme.icon.size.base,
                  theme.icon.gray,
                  onIconClick && 'cursor-pointer',
                )}
                onClick={() => onIconClick && onIconClick()}
              />
            </div>
          )}
          <input
            type={type}
            id={id}
            placeholder={placeholder}
            value={value}
            className={classNames(
              theme.base,
              label && 'mt-1',
              rounded === 'full' ? theme.rounded.full : theme.rounded.base,
              squared ? theme.squared[squared] : '',
              size && size === 'large' ? theme.size.large : theme.size.base,
              !error ? theme.colors.gray : theme.colors.error,
              Icon && !trailingIcon && 'pl-10',
              showClearButton && 'pr-10',
              error ? theme.placeholder.error : theme.placeholder.base,
              '[&::placeholder]:!text-gray-400 [&::-webkit-input-placeholder]:!text-gray-400',
              'dark:[&::placeholder]:!text-gray-500 dark:[&::-webkit-input-placeholder]:!text-gray-500',
            )}
            {...cleanProps}
            ref={ref}
            style={
              {
                '--tw-placeholder-opacity': '1',
              } as React.CSSProperties
            }
          />
          {showClearButton && (
            <Button
              variant='ghost'
              onClick={() => onClear && onClear()}
              className='absolute right-2 top-1/2 transform -translate-y-1/2'
              size='inputSize'
            >
              <FontAwesomeIcon icon={faXmark} className='h-4 w-4' />
            </Button>
          )}
        </div>
        {helper && (
          <p
            className={classNames(
              theme.helper.base,
              error ? theme.helper.color.error : theme.helper.color.base,
            )}
          >
            {helper}
          </p>
        )}
      </div>
    )
  },
)

TextInput.displayName = 'TextInput'
