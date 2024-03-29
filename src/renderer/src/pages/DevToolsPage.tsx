import { PAGES } from "@shared/types"
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
export const DevToolsPage = () => {


  return <div className="flex flex-col gap-1 h-[100vh] justify-center items-stretch">
    <div className="text-left pl-2">Click to open dev tools</div>
    {...Object.values(PAGES).map((elem) => {
      return <button className='p-1 bg-gray-50 hover:bg-gray-100 rounded-sm text-gray-900 hover:text-blue-700 w-100 mx-2' onClick={() => {
        window.api.openDevTool(elem)
      }}>
        <div className="flex flex-row justify-start items-center gap-1 ">
          <FontAwesomeIcon icon={faCode} />
          <span className="first-letter:uppercase">
            {elem}
          </span>
        </div>
      </button>
    })
    }
  </div>
}
