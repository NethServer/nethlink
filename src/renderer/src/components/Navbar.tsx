import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import { faSliders, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/Avatar'
import { Button } from './Nethesis/Button'
import { Menu } from '@headlessui/react'

export interface NavabarProps {
  showLogoutMenu: boolean
  openSettings: () => void
  handleSearch: (searchText: string) => Promise<void>
  handleTextChange: (searchText: string) => Promise<void>
  handleReset: () => void
  showLogoutMenuContext: () => void
}

export function Navbar({
  showLogoutMenu,
  openSettings,
  handleSearch,
  handleReset,
  handleTextChange,
  showLogoutMenuContext
}: NavabarProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between gap-4 min-w-[318px] min-h-[38px] px-4">
      <SearchBox
        handleSearch={handleSearch}
        handleReset={handleReset}
        handleTextChange={handleTextChange}
      />
      <div className="flex flex-row min-w-20 gap-4 items-center">
        <Button onClick={openSettings} className="min-w-8 min-h-8 border-none pt-0 pr-0 pb-0 pl-0">
          <FontAwesomeIcon icon={faSliders} className="h-5 w-5" />
        </Button>
        <div>
          <Menu>
            <div>
              <Menu.Button>
                <Avatar
                  size="small"
                  status="online"
                  className="bg-white"
                  /* onClick={showLogoutMenuContext} */
                />
              </Menu.Button>
            </div>

            <Menu.Items
              className={`mt-2 fixed border border-gray-700 rounded-lg min-w-[185px] min-h-[125px] bg-gray-900 z-20 translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div>
                  <p>sign in as</p>
                </div>
              </Menu.Item>
              <Menu.Item>
                <p>logout</p>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      {/* {showModal && (
        <Modal show={showModal} onClose={showSignOutModal} afterLeave={showSignOutModal}>
          <Modal.Content>
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-red-100 dark:bg-red-900">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="h-6 w-6 text-red-600 dark:text-red-200"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                hello 1
              </h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">hello 2</p>
              </div>
            </div>
          </Modal.Content>
          <Modal.Actions>
            <div
              className="flex items-center gap-4 py-[10px] px-2 w-full min-h-9 hover:bg-gray-700 text-gray-200"
              onClick={showSignOutModal}
            >
              <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faArrowRightFromBracket} />
              <p>Logout</p>
            </div>
          </Modal.Actions>
        </Modal>
      )} */}
    </div>
  )
}
