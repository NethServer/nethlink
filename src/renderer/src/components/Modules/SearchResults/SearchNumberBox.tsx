import { faPhone as CallIcon, faUserPlus as AddUserIcon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useEffect, useState } from 'react'
import { NethLinkPageData, OperatorData, SearchCallData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { log } from '@shared/utils/logger'
import { useAccount } from '@renderer/hooks/useAccount'
import { cloneDeep } from 'lodash'
import { cleanRegex, getIsPhoneNumber, sortByProperty } from '@renderer/lib/utils'
import { useStoreState } from '@renderer/store'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Scrollable } from '@renderer/components/Scrollable'

interface SearchNumberBoxProps {
  searchResult: SearchData[] | undefined
  showContactForm: () => void
}
export function SearchNumberBox({ searchResult, showContactForm }: SearchNumberBoxProps) {
  const [nethLinkPageData, setNethLinkPageData] =
    useStoreState<NethLinkPageData>('nethLinkPageData')
  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookModule = usePhonebookSearchModule()
  const [searchText] = phoneBookModule.searchTextState
  const [operators] = useStoreState<OperatorData>('operators')
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [canAddToPhonebook, setCanAddToPhonebook] = useState<boolean>(false)
  const { isCallsEnabled } = useAccount()

  useEffect(() => {
    if (searchResult) preparePhoneNumbers(searchResult)
  }, [searchResult, searchText])

  const showAddContactToPhonebook = () => {
    showContactForm()
  }

  const getFoundedOperators = () => {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    let operatorsResults = Object.values(operators?.operators || {}).filter((op: any) => {
      return (
        (op.name && new RegExp(cleanQuery, 'i').test(op.name.replace(cleanRegex, ''))) ||
        new RegExp(cleanQuery, 'i').test(op.endpoints?.mainextension[0]?.id)
      )
    })

    if (operatorsResults.length) {
      operatorsResults = cloneDeep(operatorsResults)

      operatorsResults.forEach((op: any) => {
        op.resultType = 'operator'
      })
    }
    operatorsResults.sort(sortByProperty('name'))
    return operatorsResults
  }

  function preparePhoneNumbers(unFilteredNumbers: SearchData[]) {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    if (cleanQuery.length == 0) {
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

    const filteredOperators = getFoundedOperators()

    unFilteredNumbers.sort((a, b) => {
      if (isPhoneNumber) {
        const al = s(a).length
        if (al > 0) {
          if (al === searchText?.length) return -1
          const bl = s(b).length
          if (bl > 0) return al - bl
        }
        return -1
      } else {
        const as = a?.name?.toLowerCase()?.replace(cleanRegex, '')
        const bs = b?.name?.toLowerCase()?.replace(cleanRegex, '')
        return as < bs ? -1 : as > bs ? 1 : 0
      }
    })

    const getId = (o) => parseInt(o?.endpoints?.['extension']?.[0]?.['id']) || -1
    const mappedOperators: SearchData[] = filteredOperators
      .filter((o) => getId(o) !== -1)
      .map((o) => {
        const id = getId(o)
        return {
          ...o,
          cellphone: o?.endpoints?.['cellphone']?.[0]?.['id'],
          fax: '',
          homecity: '',
          homecountry: '',
          homeemail: '',
          homephone: '',
          homepob: '',
          homepostalcode: '',
          homeprovince: '',
          homestreet: '',
          id: id,
          notes: '',
          owner_id: '',
          source: '',
          speeddial_num: o?.endpoints?.['mainextension']?.[0]?.id || '',
          title: '',
          type: '',
          url: '',
          workcity: '',
          workcountry: '',
          workemail: '',
          workphone: '',
          workpob: '',
          workpostalcode: '',
          workprovince: '',
          workstreet: '',
          company: '',
          extension: o?.endpoints?.['mainextension']?.[0]?.id || '',
          isOperator: true,
          kind: 'person',
          displayName: o?.name
        }
      })
    const names = mappedOperators.map((o) => o?.name?.toLowerCase()?.replace(/\s/g, ''))

    unFilteredNumbers = unFilteredNumbers.filter((e) => {
      const target = e?.name?.toLowerCase()?.replace(/\s/g, '')
      if (!names.includes(target)) {
        names.push(target)
        return true
      }
      //I make sure I have a set
      return false
    })
    const copy = [...mappedOperators, ...unFilteredNumbers]

    let _canAddInPhonebook = isPhoneNumber

    setFilteredPhoneNumbers(() => copy)
    log({
      _canAddInPhonebook
    })
    setCanAddToPhonebook(() => _canAddInPhonebook)
  }

  const isCallButtonEnabled =
    searchText && isCallsEnabled && getIsPhoneNumber(searchText) && searchText.length > 1

  return (
    <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight">
      <div className='mr-[6px]'>
        <div
          className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start  ${isCallButtonEnabled ? 'cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight' : 'dark:bg-hoverDark bg-hoverLight opacity-50 cursor-not-allowed'}`}
          onClick={() => {
            if (isCallButtonEnabled && searchText)
              callNumber(searchText)
          }}
        >
          <FontAwesomeIcon
            className="text-base dark:text-gray-50 text-gray-600 mr-1"
            icon={CallIcon}
          />
          <p className="font-normal">
            {t('Operators.Call')} {searchText}
          </p>
        </div>

        <div
          className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9  ${canAddToPhonebook ? 'cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight' : ' dark:bg-hoverDark bg-hoverLight opacity-50 cursor-not-allowed'}`}
          onClick={() => {
            if (canAddToPhonebook) showAddContactToPhonebook()
          }}
        >
          <FontAwesomeIcon className="text-base dark:text-gray-50 text-gray-600" icon={AddUserIcon} />
          <p className="font-normal">
            {t('Common.Add')} {searchText?.toString()} {t('Common.to')} {t('Phonebook.Phonebook')}
          </p>
        </div>
      </div>
      <Scrollable className="max-h-[178px]">
        {filteredPhoneNumbers.map((user, index) => (
          <SearchNumber
            key={'SearchNumber_' + index}
            user={user}
            className="dark:hover:bg-hoverDark hover:bg-hoverLight"
          />
        ))}
      </Scrollable>
    </div>
  )
}
