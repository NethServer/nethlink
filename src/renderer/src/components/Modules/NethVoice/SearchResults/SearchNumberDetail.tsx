import {
  faPhone as CallIcon,
  faUserPlus as AddUserIcon,
  faSearch as EmptySearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useEffect, useState } from 'react'
import { BaseAccountData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { useAccount } from '@renderer/hooks/useAccount'
import { cloneDeep } from 'lodash'
import { cleanRegex, getIsPhoneNumber, sortByProperty } from '@renderer/lib/utils'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { debouncer } from '@shared/utils/utils'

interface SearchNumberBoxProps {
  contact: SearchData
}
export function SearchNumberBox({ contact }: SearchNumberBoxProps) {

  return (
    <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full">
      <div className="mr-[6px]">

      </div>
      <Scrollable>

      </Scrollable>
    </div>
  )
}
