// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PropsWithChildren } from 'react'
import { Account } from '@shared/types'

export interface ClearProps {
  key: string
  source: Record<string, unknown>
}

const clean = ({ key, source }: ClearProps): object => {
  delete source[key]
  return source
}

export const cleanClassName = (props: PropsWithChildren<object>): object => {
  return clean({
    key: 'className',
    source: props,
  })
}
export const cleanRegex = /[^a-zA-Z0-9]/g
export const getIsPhoneNumber = (text: string) => {
  const cleanQuery = text.replace(cleanRegex, '')
  if (cleanQuery.length == 0) {
    return false
  }
  let isPhoneNumber = false
  if (/^\+?[0-9|\s]+$/.test(cleanQuery)) {
    // show "Call phone number" result
    isPhoneNumber = true
  }
  return isPhoneNumber
}

/**
 * Sort function to order array elements by a specific property (for array of objects) or by a specific index (for arrays of arrays)
 */
export const sortByProperty = (property: string | number) => {
  return function (a: any, b: any) {
    if (a[property] < b[property]) {
      return -1
    }
    if (a[property] > b[property]) {
      return 1
    }
    return 0
  }
}

export function getTimezone(account: Account) {
  if (typeof account === 'undefined') {
    return ''
  }
  // @ts-ignore
  return `${account.timezone || 'UTC'}`
}

export function getNumericTimezone(account: Account) {
  if (typeof account === 'undefined') {
    return ''
  }
  // @ts-ignore
  return `${account.numeric_timezone || '+0100'}`
}
