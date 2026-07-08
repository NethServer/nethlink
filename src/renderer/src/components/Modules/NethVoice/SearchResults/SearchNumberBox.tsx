import {
  faPhone as CallIcon,
  faUserPlus as AddUserIcon,
  faSearch as EmptySearchIcon,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useEffect, useState } from 'react'
import { BaseAccountData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { useAccount } from '@renderer/hooks/useAccount'
import { cloneDeep } from 'lodash'
import {
  cleanRegex,
  getIsPhoneNumber,
  sortByProperty,
} from '@renderer/lib/utils'
import { useNethlinkData, useSharedState } from '@renderer/store'
import {
  getAllowedOperatorGroupsIds,
  getPresencePanelPermissions,
} from '@shared/phonebook'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { Button } from '@renderer/components/Nethesis'
import { debouncer } from '@shared/utils/utils'
import classNames from 'classnames'

interface SearchNumberBoxProps {
  searchResult: SearchData[] | undefined
  showContactForm: () => void
  showContactDetail: (contact: SearchData, primaryNumber: string | null) => void
  className?: string
}
export function SearchNumberBox({
  searchResult,
  showContactForm,
  showContactDetail,
  className,
}: SearchNumberBoxProps) {
  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookModule = usePhonebookSearchModule()
  const [searchText] = phoneBookModule.searchTextState
  const [operators] = useNethlinkData('operators')
  const [account] = useSharedState('account')
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<
    SearchData[]
  >([])
  const [canAddToPhonebook, setCanAddToPhonebook] = useState<boolean>(false)
  const { isCallsEnabled } = useAccount()

  const isPhoneNumberQuery = !!searchText && getIsPhoneNumber(searchText)
  useEffect(() => {
    if (searchResult) preparePhoneNumbers(searchResult)
  }, [searchResult, searchText])

  const showAddContactToPhonebook = () => {
    showContactForm()
  }

  const getVisibleOperatorGroups = (): string[] | null => {
    const profile = account?.data?.profile
    const allGroups = operators?.groups
    const username = account?.data?.username
    if (!profile || !allGroups) {
      return null
    }

    const presencePermissions = getPresencePanelPermissions(profile)
    if (presencePermissions?.['all_groups']?.value === true) {
      return Object.keys(allGroups)
    }

    const allowedGroupsIds = getAllowedOperatorGroupsIds(profile)
    const allowedGroups = Object.keys(allGroups).filter((group) => {
      const groupId = 'grp_' + group.replace(/[^a-z0-9]/gi, '').toLowerCase()
      return allowedGroupsIds.includes(groupId)
    })

    const belongingGroups = username
      ? Object.keys(allGroups).filter((groupName) =>
          allGroups[groupName]?.users?.includes(username),
        )
      : []

    return Array.from(new Set([...allowedGroups, ...belongingGroups]))
  }

  const getFoundedOperators = (): BaseAccountData[] => {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    const visibleGroups = getVisibleOperatorGroups()
    let candidates = Object.values(operators?.operators || {})
    if (visibleGroups) {
      candidates = candidates.filter((op: any) =>
        visibleGroups.some((g) =>
          operators?.groups?.[g]?.users?.includes(op.username),
        ),
      )
    }
    let operatorsResults = candidates.filter(
      (op: any) => {
        return (
          (op.name &&
            new RegExp(cleanQuery, 'i').test(
              op.name.replace(cleanRegex, ''),
            )) ||
          new RegExp(cleanQuery, 'i').test(op.endpoints?.mainextension[0]?.id)
        )
      },
    )

    if (operatorsResults.length) {
      operatorsResults = cloneDeep(operatorsResults)

      operatorsResults.forEach((op: any) => {
        op.resultType = 'operator'
        op.extension = op.endpoints?.mainextension[0]?.id //for phoneNumber search
      })
    }
    operatorsResults.sort(sortByProperty('name'))
    return operatorsResults
  }

  function preparePhoneNumbers(unFilteredNumbers: SearchData[]) {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    if (cleanQuery.length == 0) {
      setCanAddToPhonebook(false)
      return
    }

    const isPhoneNumber = getIsPhoneNumber(searchText || '')

    const keys = ['extension', 'cellphone', 'homephone', 'workphone']
    const s = (a) => {
      return keys.reduce((p, c) => {
        if (p === '') p = a[c] || ''
        return p
      }, '')
    }

    if (isPhoneNumber) {
      unFilteredNumbers.sort((a, b) => {
        const al = s(a).length
        if (al > 0) {
          if (al === searchText?.length) return -1
          const bl = s(b).length
          if (bl > 0) return al - bl
        }
        return -1
      })
    }

    const filteredOperators = getFoundedOperators()
    const copy = [...filteredOperators, ...unFilteredNumbers]
    // Allow creating a contact from any meaningful query — number or name.
    let _canAddInPhonebook = cleanQuery.length > 1
    setFilteredPhoneNumbers(() => copy as any)
    setCanAddToPhonebook(() => _canAddInPhonebook)
  }

  const isCallButtonEnabled =
    searchText &&
    isCallsEnabled &&
    getIsPhoneNumber(searchText) &&
    searchText.length > 1

  return (
    <div
      className={classNames(
        'flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full',
        className,
      )}
    >
      {(isPhoneNumberQuery || canAddToPhonebook) && (
        <div className='mr-[6px] px-3 pt-1 pb-1 border-b dark:border-borderDark border-borderLight flex flex-col gap-0.5'>
          {isPhoneNumberQuery && (
            <Button
              variant='tertiary'
              disabled={!isCallButtonEnabled}
              className='gap-3 self-start disabled:opacity-50'
              onClick={() => {
                if (isCallButtonEnabled && searchText) {
                  debouncer(
                    'onCallNumber',
                    () => {
                      callNumber(searchText)
                    },
                    250,
                  )
                }
              }}
            >
              <FontAwesomeIcon className='h-4 w-4' icon={CallIcon} />
              <span className='font-medium text-sm leading-5'>
                {t('Operators.Call')} {searchText}
              </span>
            </Button>
          )}
          {canAddToPhonebook && (
            <Button
              variant='tertiary'
              className='gap-3 self-start'
              onClick={showAddContactToPhonebook}
            >
              <FontAwesomeIcon className='h-4 w-4' icon={AddUserIcon} />
              <span className='font-medium text-sm leading-5'>
                {t('Phonebook.Create contact')}
              </span>
            </Button>
          )}
        </div>
      )}
      <Scrollable>
        {filteredPhoneNumbers.length > 0 ? (
          filteredPhoneNumbers.map((user, index) => (
            <SearchNumber
              key={'SearchNumber_' + index}
              user={user}
              onClick={user.displayName ? showContactDetail : undefined}
            />
          ))
        ) : (
          <EmptyList
            icon={EmptySearchIcon}
            text={t('Phonebook.No contacts found')}
            subtitle={t('Phonebook.Try changing your search') as string}
          />
        )}
      </Scrollable>
    </div>
  )
}
