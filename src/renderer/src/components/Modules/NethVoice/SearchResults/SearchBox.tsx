import {
  faMagnifyingGlass as SearchIcon,
  faXmark as DeleteSearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect } from 'react'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useNethlinkData } from '@renderer/store'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { useForm } from 'react-hook-form'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { Log } from '@shared/utils/logger'
import { debouncer } from '@shared/utils/utils'

type FormDataType = {
  searchText: string | undefined;
}
export function SearchBox(): JSX.Element {

  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookSearchModule = usePhonebookSearchModule()
  const [searchText, setSearchText] = phoneBookSearchModule.searchTextState
  const [phonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const [, setShowPhonebookSearchModule] = useNethlinkData('showPhonebookSearchModule')
  const [, setShowAddContactModule] = useNethlinkData('showAddContactModule')

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
    if (phonebookSearchModule?.searchText != null) {
      setShowPhonebookSearchModule(!!searchText)
      setShowAddContactModule(false)
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
      setShowPhonebookSearchModule(false)
    }
  }, [tempSearchText])

  function submit(data: FormDataType): void {
    setSearchText(data.searchText)
  }

  function handleCallUser(e) {
    if (e.key === 'Enter') {
      if (searchText) {
        debouncer('SearchBar-onEnterKey', () => {
          try {
            callNumber(searchText)
          } catch (e) {
            Log.warning(e)
          } finally {
            submit({ searchText })
          }
        })
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
