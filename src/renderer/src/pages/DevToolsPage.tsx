import { PAGES, PageType } from '@shared/types'
import { faCode, faBell, faSlash, faWifi, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useStoreState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { sendNotification } from '@renderer/utils'
import { ReactNode } from 'react'

interface DevToolProps {
  handleRefreshConnection: () => void
}
export const DevToolsPage = ({ handleRefreshConnection }: DevToolProps) => {
  const [page] = useStoreState<PageType>('page')
  const [connection, setConnection] = useStoreState<boolean>('connection')
  useInitialize(() => { }, true)

  const toggleConnection = () => {
    setConnection((p) => !p)
  }

  const handleSendNotification = () => {
    sendNotification('Test title string', 'Test body string')
  }

  const Line = ({ onClick, icon, iconNode, elem }: { onClick?: () => void, icon?: IconDefinition, iconNode?: ReactNode, elem: ReactNode }) => {
    return <button
      className="p-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 rounded-sm text-gray-900 dark:text-gray-100 hover:text-blue-700 w-100 mx-2"
      onClick={onClick}>
      <div className="flex flex-row justify-start items-center gap-2">
        {icon && <FontAwesomeIcon icon={icon} />}
        {iconNode}
        <div className="first-letter:uppercase">{elem}</div>
      </div>
    </button >
  }
  return (
    <div className="flex flex-col gap-1 h-[100vh] justify-start items-stretch bg-gray-100 dark:bg-gray-900 pt-2">
      <div className="flex flex-row justify-between items-center text-left px-2 text-gray-900 dark:text-gray-100">
        <span>
          Click to open dev tools
        </span>
      </div>
      {...Object.values(PAGES).map((elem, idx) => {
        return (
          // eslint-disable-next-line react/jsx-key
          <Line
            key={idx}
            icon={faCode}
            onClick={() => {
              window.api.openDevTool(elem)
            }}
            elem={elem}
          />
        )
      })}
      <hr />
      <Line
        onClick={toggleConnection}
        iconNode={
          <div className='relative -top-2'>
            <div className='fixed flex justify-center'>
              <FontAwesomeIcon icon={faWifi} />
              {!connection && <div className='absolute'>
                <FontAwesomeIcon icon={faSlash} className='relative left-0px top-[-3px]' />
              </div>}
            </div>
          </div>
        }
        elem={<div className='relative left-5'>{`${!connection ? 'NO' : ''} Connection`}</div>}
      />
      < Line
        onClick={handleSendNotification}
        icon={faBell}
        elem={'Test Notifica'}
      />
      <hr />
      <Line
        elem={`version: ${window.api.appVersion}`}
      />
    </div >
  )
}
