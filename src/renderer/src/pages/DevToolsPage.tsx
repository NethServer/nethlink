import { PAGES, PageType } from '@shared/types'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useStoreState } from '@renderer/store'
import { useEffect } from 'react'
import { log } from '@shared/utils/logger'

export const DevToolsPage = () => {
  const [page] = useStoreState<PageType>('page')
  useInitialize(() => { }, true)

  return (
    <div className="flex flex-col gap-1 h-[100vh] justify-center items-stretch bg-gray-100 dark:bg-gray-900 ">
      <div className="text-left pl-2 text-gray-900 dark:text-gray-100">Click to open dev tools</div>
      {...Object.values(PAGES).map((elem) => {
        return (
          // eslint-disable-next-line react/jsx-key
          <button
            className="p-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded-sm text-gray-900 dark:text-gray-100 hover:text-blue-700 w-100 mx-2"
            onClick={() => {
              window.api.openDevTool(elem)
            }}
          >
            <div className="flex flex-row justify-start items-center gap-1 ">
              <FontAwesomeIcon icon={faCode} />
              <span className="first-letter:uppercase">{elem}</span>
            </div>
          </button>
        )
      })}
      <p className="dark:text-gray-300 text-gray-700 text-sm px-5 text-center mt-4">
        v{page?.props.appVersion}
      </p>
    </div>
  )
}
