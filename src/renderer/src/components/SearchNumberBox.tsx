import { faPhone as CallIcon, faUserPlus as AddUserIcon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useEffect, useState } from 'react'
import { OperatorData, SearchCallData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { log } from '@shared/utils/logger'
import { useAccount } from '@renderer/hooks/useAccount'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { cloneDeep } from 'lodash'
import { sortByProperty } from '@renderer/lib/utils'

const cleanRegex = /[^a-zA-Z0-9]/g
export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
  showAddContactToPhonebook: () => void
}

export function SearchNumberBox({
  searchText,
  callUser,
  showAddContactToPhonebook
}: SearchNumberBoxProps) {
  const operators = useSubscriber<OperatorData>('operators')
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [unFilteredPhoneNumbers, setUnFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [canAddToPhonebook, setCanAddToPhonebook] = useState<boolean>(false)
  const { isCallsEnabled } = useAccount()

  useInitialize(() => {
    window.api.onSearchResult(saveUnfiltered)
  })

  function saveUnfiltered(receivedPhoneNumbers: SearchCallData) {
    log('Receveid numbers: ', receivedPhoneNumbers)
    receivedPhoneNumbers.rows = receivedPhoneNumbers.rows.map((contact: any) => {
      return mapContact(contact)
    })
    const filteredNumbers = receivedPhoneNumbers.rows.filter(
      (phoneNumber) => !(!phoneNumber.name || phoneNumber.name === '')
    )

    setUnFilteredPhoneNumbers(() => filteredNumbers)
  }

  useEffect(() => {
    preparePhoneNumbers(unFilteredPhoneNumbers)
  }, [unFilteredPhoneNumbers, searchText])


  const getIsPhoneNumber = (text: string) => {
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


  const getFoundedOperators = () => {
    const cleanQuery = searchText.replace(cleanRegex, '')
    let operatorsResults = Object.values(operators.operators).filter((op: any) => {
      return (
        new RegExp(cleanQuery, 'i').test(op.name.replace(cleanRegex, '')) ||
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

  function mapContact(contact: any) {
    // kind & display name
    if (contact.name) {
      contact.kind = 'person'
      contact.displayName = contact.name
    } else {
      contact.kind = 'company'
      contact.displayName = contact.company
    }

    // company contacts
    if (contact.contacts) {
      contact.contacts = JSON.parse(contact.contacts)
    }
    return contact
  }

  function preparePhoneNumbers(unFilteredNumbers: SearchData[]) {

    const cleanQuery = searchText.replace(cleanRegex, '')
    if (cleanQuery.length == 0) {
      return
    }

    const isPhoneNumber = getIsPhoneNumber(searchText)

    const keys = ['extension', 'cellphone', 'homephone', 'workphone']
    const s = (a) => {
      return keys.reduce((p, c) => {
        if (p === '') p = a[c] || ''
        return p
      }, '')
    }

    const filteredOperators = getFoundedOperators()

    unFilteredNumbers.sort((a, b) => {
      log({ isPhoneNumber, aname: a.name, anum: s(a), bname: b.name, bnum: s(b) })
      if (isPhoneNumber) {
        const al = s(a).length
        if (al > 0) {
          if (al === searchText.length) return -1
          const bl = s(b).length
          if (bl > 0) return al - bl
        }
        return -1
      } else {
        const as = a.name.toLowerCase().replace(cleanRegex, '')
        const bs = b.name.toLowerCase().replace(cleanRegex, '')
        return as < bs ? -1 : as > bs ? 1 : 0
      }
    })
    const mappedOperators: SearchData[] = filteredOperators.map((o) => {
      return {
        ...o,
        cellphone: o.endpoints['cellphone']?.[0]?.['id'],
        fax: '',
        homecity: '',
        homecountry: '',
        homeemail: '',
        homephone: '',
        homepob: '',
        homepostalcode: '',
        homeprovince: '',
        homestreet: '',
        id: parseInt(o.endpoints['extension']?.[0]?.['id']),
        notes: '',
        owner_id: '',
        source: '',
        speeddial_num: o.endpoints['mainextension']?.[0]?.id || '',
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
        extension: o.endpoints['extension'][0]['id'],

      }
    })
    const copy = [
      ...mappedOperators,
      ...unFilteredNumbers
    ]

    let _canAddInPhonebook = false
    if (copy.length > 0) {
      copy.forEach((contact) => {
        _canAddInPhonebook = keys.reduce((p, k) => {
          if (!p) {
            p = contact[k]?.replace(/\s/g, '')?.includes(cleanQuery)
          }
          return p
        }, false)
      })
    }

    log("COPY:", copy, filteredOperators, unFilteredNumbers)

    setFilteredPhoneNumbers(() => copy)
    setCanAddToPhonebook(() => _canAddInPhonebook)
  }

  return (
    <div className="flex flex-col dark:text-gray-50 text-gray-900 dark:bg-gray-900 bg-gray-50">
      <div
        className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start  ${isCallsEnabled && getIsPhoneNumber(searchText) ? 'cursor-pointer dark:hover:bg-gray-800 hover:bg-gray-200' : 'dark:bg-gray-800 bg-gray-200 opacity-50 cursor-not-allowed'}`}

        onClick={() => {
          if (isCallsEnabled && getIsPhoneNumber(searchText))
            callUser(searchText)
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
        className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9  ${isCallsEnabled && canAddToPhonebook ? 'cursor-pointer dark:hover:bg-gray-800 hover:bg-gray-200' : ' dark:bg-gray-800 bg-gray-200 opacity-50 cursor-not-allowed'}`}
        onClick={() => {
          if (canAddToPhonebook)
            showAddContactToPhonebook()
        }}
      >
        <FontAwesomeIcon className="text-base dark:text-gray-50 text-gray-600" icon={AddUserIcon} />
        <p className="font-normal">
          {t('Common.Add')} {searchText.toString()} {t('Common.to')} {t('Phonebook.Phonebook')}
        </p>
      </div>
      <div className={`border-b dark:border-gray-700 border-gray-200`}></div>
      <div className="overflow-y-auto max-h-[178px]">
        {filteredPhoneNumbers.map((user, index) => (
          <SearchNumber
            key={index}
            user={user}
            callUser={callUser}
            searchText={searchText}
            className="dark:hover:bg-gray-800 hover:bg-gray-200"
          />
        ))}
      </div>
    </div>
  )
}
