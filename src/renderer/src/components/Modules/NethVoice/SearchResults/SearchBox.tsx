import {
  faMagnifyingGlass as SearchIcon,
  faXmark as DeleteSearchIcon,
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
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'
type FormDataType = {
  searchText: string | undefined
}
export function SearchBox(): JSX.Element {
  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookSearchModule = usePhonebookSearchModule()
  const [searchText, setSearchText] = phoneBookSearchModule.searchTextState
  const [phonebookSearchModule] = useNethlinkData('phonebookSearchModule')
  const [, setShowPhonebookSearchModule] = useNethlinkData(
    'showPhonebookSearchModule',
  )
  const [, setShowAddContactModule] = useNethlinkData('showAddContactModule')

  const { register, watch, reset, setValue, handleSubmit } = useForm({
    defaultValues: {
      searchText: '',
    },
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
    <form
      className='flex flex-row items-center relative w-full'
      onSubmit={handleSubmit(submit)}
    >
      <TextInput
        rounded='base'
        icon={SearchIcon}
        type='text'
        placeholder={t('Common.Call or compose') as string}
        onKeyDown={handleCallUser}
        aria-label={t('Common.Call or compose') ?? undefined}
        className='min-w-0 dark:text-titleDark text-titleLight'
        {...register('searchText')}
      />
      {tempSearchText !== '' && (
        <Button
          variant='ghost'
          size='small'
          type='reset'
          aria-label={t('Common.Clear search') ?? undefined}
          data-tooltip-id='tooltip-clear-search'
          data-tooltip-content={t('Common.Clear search') ?? undefined}
          className='absolute right-2 z-20 p-1'
          onClick={handleClearButton}
        >
          <FontAwesomeIcon
            icon={DeleteSearchIcon}
            className='size-4 text-gray-600 dark:text-gray-400'
            aria-hidden='true'
          />
        </Button>
      )}
      {tempSearchText !== '' && (
        <CustomThemedTooltip id='tooltip-clear-search' place='bottom' />
      )}
    </form>
  )
}
