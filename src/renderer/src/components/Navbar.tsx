import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import {
  faSliders,
  faArrowRightFromBracket,
  faPalette,
  faSun,
  faMoon,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/Avatar'
import { Button } from './Nethesis/Button'
import { Menu } from '@headlessui/react'
import { Account } from '@shared/types'
import { PlaceholderIcon } from '@renderer/icons'

export interface NavabarProps {
  account: Account
  setAccount: React.Dispatch<React.SetStateAction<Account | undefined>>
  logout: () => void
  handleSearch: (searchText: string) => Promise<void>
  handleTextChange: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function Navbar({
  account,
  setAccount,
  logout,
  handleSearch,
  handleReset,
  handleTextChange
}: NavabarProps): JSX.Element {
  function setTheme(theme) {
    const updateAccount = { ...account, theme: theme }
    setAccount(updateAccount)
    //window.electron.ipcRenderer.send('openWindow', 'settings')
  }

  return (
    <div className="flex flex-row justify-between gap-4 min-w-[318px] min-h-[38px] px-4 text-gray-50">
      <SearchBox
        handleSearch={handleSearch}
        handleReset={handleReset}
        handleTextChange={handleTextChange}
      />
      <div className="flex flex-row min-w-20 gap-4 items-center">
        <div>
          <Menu>
            <div>
              <Menu.Button>
                <Button className="min-w-8 min-h-8 border-none pt-0 pr-0 pb-0 pl-0">
                  <FontAwesomeIcon icon={faSliders} className="h-5 w-5" />
                </Button>
              </Menu.Button>
            </div>

            <Menu.Items
              className={`mt-2 fixed border border-gray-700 rounded-lg min-w-[225px] min-h-[145px] bg-gray-900 z-20 translate-x-[calc(-100%+36px)]`}
            >
              <p className="text-xs leading-[18px] py-1 px-4 mt-1">THEME</p>
              <Menu.Item>
                <div
                  className={`flex flex-row items-center gap-4 hover:bg-gray-700 mt-2 ${account.theme === 'system' ? 'py-2 px-4' : 'py-2 pr-4 pl-12'}`}
                  onClick={() => setTheme('system')}
                >
                  {account.theme === 'system' && (
                    <FontAwesomeIcon
                      className="text-blue-500"
                      style={{ fontSize: '16px' }}
                      icon={faCheck}
                    />
                  )}
                  <div className="flex gap-2 items-center">
                    <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faPalette} />
                    <p className="font-semibold">System</p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className={`flex flex-row items-center gap-4 hover:bg-gray-700 mt-2 ${account.theme === 'light' ? 'py-2 px-4' : 'py-2 pr-4 pl-12'}`}
                  onClick={() => setTheme('light')}
                >
                  {account.theme === 'light' && (
                    <FontAwesomeIcon
                      className="text-blue-500"
                      style={{ fontSize: '16px' }}
                      icon={faCheck}
                    />
                  )}
                  <div className="flex gap-2 items-center">
                    <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faSun} />
                    <p className="font-semibold">Light</p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className={`flex flex-row items-center gap-4 hover:bg-gray-700 mt-2 ${account.theme === 'dark' ? 'py-2 px-4' : 'py-2 pr-4 pl-12'}`}
                  onClick={() => setTheme('dark')}
                >
                  {account.theme === 'dark' && (
                    <FontAwesomeIcon
                      className="text-blue-500"
                      style={{ fontSize: '16px' }}
                      icon={faCheck}
                    />
                  )}
                  <div className="flex gap-2 items-center">
                    <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faMoon} />
                    <p className="font-semibold">Dark</p>
                  </div>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
        <div>
          <Menu>
            <div>
              <Menu.Button>
                <Avatar
                  size="small"
                  status={account.data?.presence}
                  placeholder={PlaceholderIcon}
                />
              </Menu.Button>
            </div>

            <Menu.Items
              className={`mt-2 fixed border border-gray-700 rounded-lg min-w-[180px] min-h-[125px] bg-gray-900 z-20 translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div className="flex flex-col w-full py-[10px] px-6 border-b-[1px] border-gray-600">
                  <p className="text-gray-400">Sign in as</p>
                  <div className="flex flex-row gap-4">
                    <p className="text-gray-50 font-semibold">{account.data?.name}</p>
                    <p className="text-gray-400">{account.data?.endpoints.mainextension[0].id}</p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className="flex flex-row items-center gap-4 py-[10px] px-6 hover:bg-gray-700 mt-2"
                  onClick={logout}
                >
                  <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faArrowRightFromBracket} />
                  <p className="font-semibold">Logout</p>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div>
  )
}
