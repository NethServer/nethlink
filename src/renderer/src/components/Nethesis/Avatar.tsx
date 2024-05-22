import {
  faUser as UserIcon,
  faBuilding as CompanyIcon,
  faHeadset as OperatorIcon,
  faStar as StarIcon,
  faTimes as DeleteAvatarIcon
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTheme } from '@renderer/theme/Context'
import { StatusTypes } from '@shared/types'
import classNames from 'classnames'
import { ComponentProps, FC } from 'react'
import { StatusDot } from './StatusDot'

export interface AvatarProps extends Omit<ComponentProps<'div'>, 'placeholder'> {
  rounded?: 'base' | 'full'
  status?: StatusTypes
  src?: string
  initials?: string
  placeholder?: FC<ComponentProps<'svg'>>
  placeholderType?: 'person' | 'company' | 'operator'
  bordered?: boolean
  altText?: string
  size?: 'extra_small' | 'small' | 'base' | 'large' | 'extra_large'
  unoptimized?: boolean
  star?: boolean
  deleteAvatar?: boolean
  isUploadAvatar?: boolean
}
export const Avatar = ({
  rounded = 'full',
  status,
  src,
  initials,
  placeholder: Placeholder,
  placeholderType,
  bordered,
  altText = 'Avatar image',
  size = 'base',
  unoptimized = true,
  star,
  deleteAvatar,
  isUploadAvatar,
  className,
  ...props
}: AvatarProps) => {
  const { avatar: theme } = useTheme().theme

  return (
    <div
      className={classNames(
        theme.base,
        theme.sizes[size],
        initials && theme.initials.background,
        Placeholder && theme.placeholder.background,
        placeholderType && theme.placeholderType.background,
        theme.rounded[rounded],
        bordered && theme.bordered,
        className
      )}
      {...props}
    >
      {src && (
        <img className={classNames(theme.image, theme.rounded[rounded])} src={src} alt={altText} />
      )}
      {initials && <div className={theme.initials.base}>{initials}</div>}
      {Placeholder && !src && <Placeholder className={theme.placeholder.base} />}
      {placeholderType && !src && (
        <div className={theme.placeholderType.base}>
          {placeholderType == 'person' && (
            <FontAwesomeIcon
              icon={UserIcon}
              className={classNames(theme.placeholderType, theme.placeholderType.sizes[size])}
              aria-hidden="true"
            />
          )}
          {placeholderType == 'company' && (
            <FontAwesomeIcon
              icon={CompanyIcon}
              className={classNames(theme.placeholderType, theme.placeholderType.sizes[size])}
              aria-hidden="true"
            />
          )}
          {placeholderType == 'operator' && (
            <FontAwesomeIcon
              icon={OperatorIcon}
              className={classNames(theme.placeholderType, theme.placeholderType.sizes[size])}
              aria-hidden="true"
            />
          )}
        </div>
      )}
      {status && (
        <div>
          <StatusDot
            status={status}
            className={`absolute bottom-0 right-0 ${size === 'extra_large' ? 'h-5 w-5' : size === 'large' ? 'h-3 w-3' : 'h-2 w-2'
              }`}
          />
        </div>
      )}
      {star && (
        <FontAwesomeIcon
          icon={StarIcon}
          aria-hidden="true"
          className={classNames(theme.star.base, theme.star.sizes[size])}
        />
      )}
      {deleteAvatar && (
        <button className={classNames(theme.deleteAvatar.button, 'tooltip-remove-profile-picture')}>
          <FontAwesomeIcon
            icon={DeleteAvatarIcon}
            aria-hidden="true"
            className={classNames(theme.deleteAvatar.base)}
          //onClick={() => removeAvatar('')}
          />
        </button>
      )}
    </div>
  )
}
