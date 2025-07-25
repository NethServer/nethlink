// Copyright (C) 2024 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { FC, ComponentProps } from 'react'
import { useTheme } from '@renderer/theme/Context'
import { cleanClassName } from '@renderer/utils'
import classNames from 'classnames'

export interface DropdownHeaderProps extends Omit<ComponentProps<'div'>, 'className'> { }

export const DropdownHeader: FC<DropdownHeaderProps> = ({ children, ...props }) => {
  const { dropdown: theme } = useTheme().theme
  const theirProps = cleanClassName(props)
  return (
    <div className={classNames(theme.items.header)} {...theirProps}>
      {children}
    </div>
  )
}