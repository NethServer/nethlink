// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 *
 * The actions wrapper for the modal.
 *
 * @param children - The content of the modal actions.
 *
 */

import { useTheme } from '@renderer/theme/Context'
import { cleanClassName } from '@renderer/utils'
import type { FC, PropsWithChildren, ComponentProps } from 'react'

export type ModalActionsProps = PropsWithChildren<Omit<ComponentProps<'div'>, 'className'>>

export const ModalActions: FC<ModalActionsProps> = ({ children, ...props }) => {
  const { modal: theme } = useTheme().theme
  const theirProps = cleanClassName(props)

  return (
    <div className={theme.actions} {...theirProps}>
      {children}
    </div>
  )
}
