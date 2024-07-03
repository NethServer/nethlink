import { faSlash, faWifi } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useStoreState } from "@renderer/store"
import classNames from "classnames"

interface ConnectionStatusProps {
  className?: string
}
export const ConnectionStatus = ({ className }: ConnectionStatusProps) => {
  const [connection] = useStoreState<boolean>('connection')
  return (
    <div className={classNames("absolute left-[calc(50vw-10px)] top-2 dark:text-gray-300 text-gray-700", className)}>
      <div className='fixed flex justify-center'>
        <FontAwesomeIcon icon={faWifi} />
        {!connection && <div className='absolute'>
          <FontAwesomeIcon icon={faSlash} className='relative left-0px top-[-3px]' />
        </div>}
      </div>
    </div>
  )
}
