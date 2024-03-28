// Copyright (C) 2023 Nethesis S.r.l.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The helper function to dispatch events
 *
 * @param name The name of the event
 * @param data The data object
 * @param element The target element
 */

export const eventDispatch = (name: string, data?: any, element: HTMLElement | Window = window) => {
  typeof element !== 'undefined'
    ? element.dispatchEvent(new CustomEvent(name, data ? { detail: data } : undefined))
    : console.error(new Error('EventDispatch error: element is not defined'))
}
