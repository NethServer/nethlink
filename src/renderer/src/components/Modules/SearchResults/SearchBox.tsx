import {
  faMagnifyingGlass as SearchIcon,
  faXmark as DeleteSearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '../../Nethesis/TextInput'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '../../Nethesis'
import { validatePhoneNumber } from '@renderer/utils'
import { useAccount } from '@renderer/hooks/useAccount'
import { useEffect, useState } from 'react'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useStoreState } from '@renderer/store'
import { NethLinkPageData } from '@shared/types'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { log } from '@shared/utils/logger'
import { useForm } from 'react-hook-form'

type FormDataType = {
  searchText: string | undefined;
}
export function SearchBox(): JSX.Element {

  const { isCallsEnabled } = useAccount()
  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookSearchModule = usePhonebookSearchModule()
  const [searchText, setSearchText] = phoneBookSearchModule.searchTextState
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')

  const {
    register,
    watch,
    reset,
    setValue,
    handleSubmit
  } = useForm({
    defaultValues: {
      searchText: ''
    }
  })

  useEffect(() => {
    if (nethLinkPageData?.phonebookSearchModule?.searchText != null) {
      setNethLinkPageData((p) => ({
        ...p,
        showPhonebookSearchModule: !!searchText,
        showAddContactModule: false
      }))
    } else {
      reset()
    }
  }, [searchText])

  const tempSearchText = watch('searchText')


  useEffect(() => {
    if (tempSearchText) {
      setSearchText(tempSearchText)
    } else {
      setValue('searchText', '')
      setNethLinkPageData((p) => ({
        ...p,
        showPhonebookSearchModule: false
      }))
    }
  }, [tempSearchText])

  function submit(data: FormDataType): void {
    setSearchText(data.searchText)
  }

  function handleCallUser(e) {
    if (e.key === 'Enter') {
      if (searchText) {
        if (validatePhoneNumber(searchText) && isCallsEnabled) {
          callNumber(searchText)
        } else {
          submit({ searchText })
        }
      }
    }
  }

  function handleClearButton(): void {
    setValue('searchText', '')
  }

  return (
    <form className="flex flex-row items-center relative w-full" onSubmit={handleSubmit(submit)}>
      <TextInput
        rounded="base"
        icon={SearchIcon}
        type="text"
        placeholder={t('Common.Call or compose') as string}
        onKeyDown={handleCallUser}
        className="min-w-[180px] dark:text-titleDark text-titleLight"
        {...register('searchText')}
      />
      {tempSearchText !== '' && (
        <Button
          variant="ghost"
          type='reset'
          className="absolute right-1 z-[101] cursor-pointer mr-2 pt-[2px] pr-[2px] pb-[2px] pl-[2px]"
          onClick={handleClearButton}
        >
          <FontAwesomeIcon
            icon={DeleteSearchIcon}
            className="dark:text-titleDark text-titleLight h-4 w-4"
          />
        </Button>
      )}
    </form>
  )
}
