// src/components/CustomThemedTooltip.tsx
import React, { FC, useEffect, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import { useSharedState } from '@renderer/store'
import { getSystemTheme, parseThemeToClassName } from '@renderer/utils'

interface CustomThemedTooltipProps {
  id: string
  place?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  isOpen?: boolean
  zIndex?: number
}

export const CustomThemedTooltip: FC<CustomThemedTooltipProps> = ({
  id,
  place = 'bottom',
  className = '',
  isOpen,
  zIndex = 9999,
}) => {
  const [theme] = useSharedState('theme')
  const getResolvedTheme = () => {
    const appContainer = document.getElementById('app-container')

    if (appContainer?.classList.contains('dark')) {
      return 'dark'
    }

    if (appContainer?.classList.contains('light')) {
      return 'light'
    }

    return theme ? parseThemeToClassName(theme) : getSystemTheme()
  }

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => getResolvedTheme())

  useEffect(() => {
    const updateResolvedTheme = () => {
      setResolvedTheme(getResolvedTheme())
    }

    updateResolvedTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const appContainer = document.getElementById('app-container')
    const observer = appContainer
      ? new MutationObserver(() => {
          updateResolvedTheme()
        })
      : null

    if (observer && appContainer) {
      observer.observe(appContainer, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }

    mediaQuery.addEventListener('change', updateResolvedTheme)

    return () => {
      observer?.disconnect()
      mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme])

  const commonTooltipStyle = {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    padding: '0.375rem 0.625rem',
    maxWidth: '320px',
    borderRadius: '4px',
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  }

  const tooltipStyle =
    resolvedTheme === 'dark'
      ? {
          ...commonTooltipStyle,
          backgroundColor: 'rgb(243, 244, 246)',
          color: 'rgb(17, 24, 39)',
        }
      : {
          ...commonTooltipStyle,
          backgroundColor: 'rgb(31, 41, 55)',
          color: 'rgb(249, 250, 251)',
        }

  return (
    <Tooltip
      id={id}
      place={place}
      className={`z-[${zIndex}] ${className}`}
      opacity={1}
      isOpen={isOpen}
      style={{
        ...tooltipStyle,
        zIndex,
      }}
    />
  )
}
