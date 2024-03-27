import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import {
  faSliders as ThemeMenuIcon,
  faArrowRightFromBracket as LogoutIcon,
  faPalette as SystemIcon,
  faSun as LightIcon,
  faMoon as DarkIcon,
  faCheck as ChooseThemeMenuIcon,
  faArrowUpRightFromSquare as GoToNethVoiceIcon
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/Avatar'
import { Listbox, Menu } from '@headlessui/react'
import { Account, AvailableThemes, OperatorData } from '@shared/types'
import { PlaceholderIcon } from '@renderer/icons'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { t } from 'i18next'

export interface NavabarProps {
  search: string
  account: Account
  onSelectTheme: (theme: AvailableThemes) => void
  logout: () => void
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
  goToNethVoicePage: () => void
}

const themeOptions = [
  { id: 1, name: 'system', icon: SystemIcon },
  { id: 2, name: 'light', icon: LightIcon },
  { id: 3, name: 'dark', icon: DarkIcon }
]

export function Navbar({
  search,
  account,
  onSelectTheme,
  logout,
  handleSearch,
  handleReset,
  goToNethVoicePage
}: NavabarProps): JSX.Element {
  const operators = useSubscriber<OperatorData>('operators')

  function setTheme(theme) {
    onSelectTheme(theme)
    //window.electron.ipcRenderer.send('openWindow', 'settings')
  }

  return (
    <div className="flex flex-row items-center justify-between gap-4 min-w-[318px] px-4 py-2">
      <SearchBox search={search} handleSearch={handleSearch} handleReset={handleReset} />
      <div className="flex flex-row min-w-20 gap-4 items-center">
        <div>
          <Listbox>
            <div>
              <Listbox.Button>
                <div className="flex items-center justify-center min-w-8 min-h-8">
                  <FontAwesomeIcon
                    icon={ThemeMenuIcon}
                    className="h-5 w-5 dark:text-gray-50 text-gray-700"
                  />
                </div>
              </Listbox.Button>
            </div>
            <Listbox.Options
              className={`dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-200 rounded-lg mt-2 fixed min-w-[225px] min-h-[145px] z-[200] translate-x-[calc(-100%+36px)]`}
            >
              <p className="dark:text-gray-50 text-gray-900 text-xs leading-[18px] py-1 px-4 mt-1">
                {t('Settings.Theme')}
              </p>
              {themeOptions.map((theme) => (
                <Listbox.Option key={theme.id} value={theme}>
                  <div
                    className={`flex flex-row items-center gap-4 dark:text-gray-50 text-gray-700 dark:hover:bg-gray-700 hover:bg-gray-200 mt-2 ${account.theme === theme.name ? 'py-2 px-4' : 'py-2 pr-4 pl-12'}`}
                    onClick={() => setTheme(theme.name)}
                  >
                    {account.theme === theme.name && (
                      <FontAwesomeIcon
                        className="dark:text-blue-500 text-blue-600"
                        style={{ fontSize: '16px' }}
                        icon={ChooseThemeMenuIcon}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon className="text-base" icon={theme.icon} />
                      <p className="font-semibold">
                        {theme.name === 'system'
                          ? t('Settings.System')
                          : theme.name === 'light'
                            ? t('Settings.Light')
                            : t('Settings.Dark')}
                      </p>
                    </div>
                  </div>
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>
        </div>

        <div>
          <Menu>
            <div>
              <Menu.Button>
                <Avatar
                  size="small"
                  status={
                    operators?.operators?.[account.username]?.mainPresence ||
                    account.data?.mainPresence ||
                    'offline'
                  }
                  src={operators?.avatars?.[account.username]}
                  placeholder={PlaceholderIcon}
                />
              </Menu.Button>
            </div>

            <Menu.Items
              className={`dark:bg-gray-900 bg-gray-50 border dark:border-gray-700 border-gray-200 mt-2 fixed rounded-lg min-w-[225px] min-h-[125px] z-[200] translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div className="flex flex-col w-full py-[10px] px-6 border-b-[1px] dark:border-gray-600">
                  <p className="dark:text-gray-400 text-gray-700">{t('TopBar.Signed in as')}</p>
                  <div className="flex flex-row gap-4">
                    <p className="dark:text-gray-50 text-gray-900 font-semibold">
                      {account.data?.name}
                    </p>
                    <p className="dark:text-gray-400 text-gray-700">
                      {account.data?.endpoints.mainextension[0].id}
                    </p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className="flex flex-row items-center gap-4 py-[10px] px-6 dark:text-gray-50 text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-200"
                  onClick={goToNethVoicePage}
                >
                  <FontAwesomeIcon className="text-base" icon={GoToNethVoiceIcon} />
                  <p className="font-semibold inline">{t('TopBar.Go to Nethvoice CTI')}</p>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className="flex flex-row items-center gap-4 py-[10px] px-6 dark:text-gray-50 text-gray-900 dark:hover:bg-gray-700 hover:bg-gray-200 mt-2"
                  onClick={logout}
                >
                  <FontAwesomeIcon className="text-base" icon={LogoutIcon} />
                  <p className="font-semibold">{t('TopBar.Logout')}</p>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div>
  )
}
