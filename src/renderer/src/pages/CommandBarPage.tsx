import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IPC_EVENTS } from '@shared/constants'
import { useSharedState } from '@renderer/store'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faSearch, faXmark, faUser, faBuilding } from '@fortawesome/free-solid-svg-icons'
import classNames from 'classnames'
import { parseThemeToClassName } from '@renderer/utils'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { AvatarType, OperatorsType, SearchCallData, SearchData, StatusTypes } from '@shared/types'
import { cleanRegex, getIsPhoneNumber, sortByProperty } from '@renderer/lib/utils'
import { debouncer } from '@shared/utils/utils'
import { Avatar } from '@renderer/components/Nethesis'

// Window = 500x80 initial. Border is faked via outer bg + p-[1px].
// Outer div: bg = border color, p-[1px], rounded-xl → 500x80
// Inner div: bg = content color, rounded-[11px] → 498x78 content area
// The 1px gap between outer and inner IS the visible border.
const INPUT_HEIGHT = 80
const INPUT_ROW_HEIGHT = 78 // 80 - 2px for the fake border
const RESULT_ROW_HEIGHT = 56
const DROPDOWN_PADDING = 8
const SEPARATOR_HEIGHT = 1
const MAX_VISIBLE_RESULTS = 5
const WINDOW_WIDTH = 500
const MIN_SEARCH_LENGTH = 3
const DEBOUNCE_MS = 250
const CACHE_TTL_MS = 30_000 // Re-fetch operators/avatars only if older than 30s

function mapContact(contact: SearchData): SearchData {
  const hasName = contact?.name && contact?.name !== '-'
  return {
    ...contact,
    kind: hasName ? 'person' : 'company',
    displayName: hasName ? contact.name : contact?.company,
    contacts: contact.contacts && typeof contact.contacts === 'string'
      ? JSON.parse(contact.contacts)
      : contact.contacts,
  }
}

function getPrimaryNumber(contact: SearchData): string {
  const keys: (keyof SearchData)[] = ['extension', 'cellphone', 'homephone', 'workphone']
  for (const key of keys) {
    if (contact[key]) return contact[key] as string
  }
  return ''
}

export function CommandBarPage() {
  const { t } = useTranslation()
  const [theme] = useSharedState('theme')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState<SearchData[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchIdRef = useRef(0)
  const operatorsRef = useRef<OperatorsType | null>(null)
  const avatarsRef = useRef<AvatarType | null>(null)
  const lastFetchRef = useRef(0) // Timestamp of last successful operators/avatars fetch
  const [operatorVersion, setOperatorVersion] = useState(0) // Bumped when operators data changes, triggers useMemo

  const isPhoneNumber = searchText.trim().length > 0 && getIsPhoneNumber(searchText.trim())

  // Local operator search — same logic as SearchNumberBox.getFoundedOperators()
  // operatorsRef is fetched once on SHOW_COMMAND_BAR via User.all_endpoints()
  // operatorVersion triggers re-computation when fresh data arrives
  const matchingOperators = useMemo(() => {
    const trimmed = searchText.trim()
    if (trimmed.length < MIN_SEARCH_LENGTH || !operatorsRef.current) return []
    const cleanQuery = trimmed.replace(cleanRegex, '')
    if (!cleanQuery) return []

    const queryRegex = new RegExp(cleanQuery, 'i')
    const results = Object.values(operatorsRef.current).filter((op: any) => {
      return (
        (op.name && queryRegex.test(op.name.replace(cleanRegex, ''))) ||
        (op.endpoints?.mainextension?.[0]?.id &&
          queryRegex.test(op.endpoints.mainextension[0].id))
      )
    })
    results.sort(sortByProperty('name'))

    return results.map((op: any) => ({
      type: 'contact' as const,
      contact: {
        displayName: op.name,
        kind: 'person' as const,
        extension: op.endpoints?.mainextension?.[0]?.id || '',
        isOperator: true,
      } as SearchData,
      username: op.username as string,
      mainPresence: op.mainPresence as StatusTypes,
    }))
  }, [searchText, operatorVersion])

  // Merge: operators first (deduped by extension), then phonebook results
  const allItems = useMemo(() => {
    const operatorExtensions = new Set(matchingOperators.map((o) => o.contact.extension))
    const filteredPhonebook = searchResults.filter((c) => {
      if (c.extension && operatorExtensions.has(c.extension)) return false
      return true
    })

    const items: { type: 'call' | 'contact'; contact?: SearchData; number?: string; username?: string; mainPresence?: StatusTypes }[] = []

    if (isPhoneNumber && searchText.trim().length > 0) {
      items.push({ type: 'call', number: searchText.trim() })
    }
    matchingOperators.forEach((op) => items.push(op))
    filteredPhonebook.forEach((contact) => {
      items.push({ type: 'contact', contact })
    })

    return items
  }, [matchingOperators, searchResults, isPhoneNumber, searchText])

  const showDropdown = allItems.length > 0

  const resizeWindow = useCallback((itemCount: number) => {
    const visibleCount = Math.min(itemCount, MAX_VISIBLE_RESULTS)
    const height = itemCount > 0
      ? INPUT_HEIGHT + SEPARATOR_HEIGHT + visibleCount * RESULT_ROW_HEIGHT + DROPDOWN_PADDING
      : INPUT_HEIGHT
    window.electron.send(IPC_EVENTS.COMMAND_BAR_RESIZE, { width: WINDOW_WIDTH, height })
  }, [])

  useEffect(() => {
    resizeWindow(allItems.length)
  }, [allItems.length, resizeWindow])

  const doSearch = useCallback(async (query: string) => {
    const currentId = ++searchIdRef.current
    const trimmed = query.trim()

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setSearchResults([])
      // Compute locally to avoid stale closure over render-scoped isPhoneNumber
      const isPhone = trimmed.length > 0 && getIsPhoneNumber(trimmed)
      setSelectedIndex(isPhone ? 0 : -1)
      return
    }

    setIsLoading(true)
    try {
      const result: SearchCallData = await NethVoiceAPI.Phonebook.search(trimmed)
      if (currentId !== searchIdRef.current) return

      const mapped = result.rows
        .map((c) => mapContact(c))
        .filter((c) => c.displayName && c.displayName !== '')
        .sort(sortByProperty('displayName'))

      setSearchResults(mapped)
      setSelectedIndex(0)
    } catch {
      if (currentId === searchIdRef.current) {
        setSearchResults([])
      }
    } finally {
      if (currentId === searchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [NethVoiceAPI])

  useEffect(() => {
    window.electron.receive(IPC_EVENTS.SHOW_COMMAND_BAR, () => {
      setSearchText('')
      setSearchResults([])
      setSelectedIndex(-1)
      setIsLoading(false)
      searchIdRef.current++

      // Fetch operators and avatars only if cache is stale (older than CACHE_TTL_MS)
      const now = Date.now()
      if (now - lastFetchRef.current > CACHE_TTL_MS) {
        const fetchId = now
        lastFetchRef.current = now

        Promise.all([
          NethVoiceAPI.User.all_endpoints(),
          NethVoiceAPI.User.all_avatars(),
        ])
          .then(([endpoints, avatars]: [OperatorsType, AvatarType]) => {
            // Discard if a newer fetch was started
            if (lastFetchRef.current !== fetchId) return
            operatorsRef.current = endpoints
            avatarsRef.current = avatars
            setOperatorVersion((v) => v + 1)
          })
          .catch(() => {})
      }

      const focusInput = (attempt = 0) => {
        inputRef.current?.focus()
        if (attempt < 3 && document.activeElement !== inputRef.current) {
          setTimeout(() => focusInput(attempt + 1), 50)
        }
      }
      setTimeout(() => focusInput(), 50)
    })

    return () => {
      window.electron.removeAllListeners(IPC_EVENTS.SHOW_COMMAND_BAR)
    }
  }, [NethVoiceAPI])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    setSelectedIndex(-1)

    debouncer('command-bar-search', () => {
      doSearch(value)
    }, DEBOUNCE_MS)
  }

  const handleCall = useCallback((number?: string) => {
    const callNumber = number || searchText.trim()
    if (!callNumber) return

    const prefixMatch = callNumber.match(/^[*#+]+/)
    const prefix = prefixMatch ? prefixMatch[0] : ''
    const sanitized = callNumber.replace(/[^\d]/g, '')
    const finalNumber = prefix + sanitized

    if (/^([*#+]?)(\d{2,})$/.test(finalNumber)) {
      window.electron.send(IPC_EVENTS.EMIT_START_CALL, finalNumber)
      window.electron.send(IPC_EVENTS.HIDE_COMMAND_BAR)
    }
  }, [searchText])

  const handleCallSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < allItems.length) {
      const item = allItems[selectedIndex]
      if (item.type === 'call') {
        handleCall(item.number)
      } else if (item.type === 'contact' && item.contact) {
        const number = getPrimaryNumber(item.contact)
        if (number) {
          handleCall(number)
        }
      }
    } else if (isPhoneNumber) {
      handleCall(searchText.trim())
    }
  }, [selectedIndex, allItems, handleCall, isPhoneNumber, searchText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      window.electron.send(IPC_EVENTS.HIDE_COMMAND_BAR)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (allItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % allItems.length)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (allItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
      }
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      handleCallSelected()
      return
    }
  }

  const handleClear = () => {
    setSearchText('')
    setSearchResults([])
    setSelectedIndex(-1)
    searchIdRef.current++
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const el = resultsRef.current.children[selectedIndex] as HTMLElement
      if (el) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const themeClass = parseThemeToClassName(theme)

  // Call button enabled when there's any text (same as original behavior)
  const hasText = searchText.trim().length > 0

  return (
    <div className={classNames(themeClass, 'font-Poppins h-screen overflow-hidden')}>
      {/* Outer = border color bg + 1px padding. Inner = content bg. The gap IS the border. */}
      <div className="w-[500px] rounded-xl p-[1px] bg-borderLight dark:bg-borderDark">
        <div className="rounded-[11px] bg-bgLight dark:bg-bgDark overflow-hidden">
          {/* Input row — 78px so that 78 + 2*1px border = 80px total */}
          <div
            className={classNames(
              'flex items-center px-4 gap-3',
            )}
            style={{ height: INPUT_ROW_HEIGHT }}
          >
            <div className="relative flex-1">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="h-4 w-4 text-gray-400 dark:text-gray-500"
                />
              </div>
              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={searchText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t('CommandBar.Placeholder') || ''}
                className={classNames(
                  'w-full bg-transparent text-sm py-2 pl-10 pr-3',
                  'dark:text-titleDark text-titleLight',
                  'border border-gray-300 dark:border-gray-600 rounded-lg',
                  'focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-600',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-500'
                )}
                autoFocus
              />
            </div>

            {searchText && (
              <button
                onClick={handleClear}
                className={classNames(
                  'p-2 rounded-full transition-colors',
                  'text-gray-400 hover:text-gray-600',
                  'dark:text-gray-500 dark:hover:text-gray-300'
                )}
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => handleCallSelected()}
              disabled={!hasText}
              className={classNames(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                'flex items-center gap-2',
                hasText
                  ? 'bg-primary text-white hover:bg-primaryDark'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              )}
            >
              <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
              <span>{t('CommandBar.Call')}</span>
            </button>
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <>
              <div className="mx-4 border-t border-borderLight dark:border-borderDark" />
              <div
                ref={resultsRef}
                className="overflow-y-auto"
                style={{ maxHeight: MAX_VISIBLE_RESULTS * RESULT_ROW_HEIGHT + DROPDOWN_PADDING }}
              >
                {allItems.map((item, index) => {
                  const isSelected = index === selectedIndex
                  if (item.type === 'call') {
                    return (
                      <div
                        key={`call-${item.number}`}
                        className={classNames(
                          'flex items-center gap-3 px-5 cursor-pointer',
                          'h-[56px]',
                          isSelected
                            ? 'dark:bg-hoverDark bg-hoverLight'
                            : 'dark:hover:bg-hoverDark hover:bg-hoverLight'
                        )}
                        onClick={() => handleCall(item.number)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <FontAwesomeIcon
                          icon={faPhone}
                          className="h-4 w-4 text-gray-500 dark:text-gray-400"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium dark:text-titleDark text-titleLight truncate">
                            {t('CommandBar.Call')} {item.number}
                          </span>
                        </div>
                      </div>
                    )
                  }

                  const contact = item.contact!
                  const number = getPrimaryNumber(contact)
                  const isOperator = !!contact.isOperator
                  const avatarSrc = isOperator && item.username
                    ? avatarsRef.current?.[item.username] || ''
                    : ''
                  return (
                    <div
                      key={`contact-${contact.id}-${index}`}
                      className={classNames(
                        'flex items-center gap-3 px-5 cursor-pointer',
                        'h-[56px]',
                        isSelected
                          ? 'dark:bg-hoverDark bg-hoverLight'
                          : 'dark:hover:bg-hoverDark hover:bg-hoverLight'
                      )}
                      onClick={() => {
                        if (number) handleCall(number)
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {isOperator ? (
                        <Avatar
                          size="small"
                          src={avatarSrc}
                          status={item.mainPresence}
                          placeholderType="operator"
                          bordered={true}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={contact.kind === 'company' ? faBuilding : faUser}
                          className="h-4 w-4 text-gray-500 dark:text-gray-400"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium dark:text-titleDark text-titleLight truncate">
                          {contact.displayName}
                        </span>
                        {number && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {number}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
