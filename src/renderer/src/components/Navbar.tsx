import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import {
  faXmarkCircle as ExitIcon,
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
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { t } from 'i18next'
import { Button } from './Nethesis'
import { faCircleUser as DefaultAvatar } from '@fortawesome/free-solid-svg-icons'
import { useAccount } from '@renderer/hooks/useAccount'

export interface NavabarProps {
  search: string
  account: Account
  callUser: (phoneNumber: string) => void
  onSelectTheme: (theme: AvailableThemes) => void
  logout: () => void
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
  goToNethVoicePage: () => void
  exitNethLink: () => void
}

const themeOptions = [
  { id: 1, name: 'system', icon: SystemIcon },
  { id: 2, name: 'light', icon: LightIcon },
  { id: 3, name: 'dark', icon: DarkIcon }
]

export function Navbar({
  search,
  account,
  callUser,
  onSelectTheme,
  logout,
  handleSearch,
  handleReset,
  goToNethVoicePage,
  exitNethLink
}: NavabarProps): JSX.Element {
  const { status } = useAccount()
  const operators = useSubscriber<OperatorData>('operators')
  const theme = useSubscriber<AvailableThemes>('theme')

  function handleSetTheme(theme) {
    onSelectTheme(theme)
  }

  return (
    <div className="flex flex-row items-center justify-between gap-4 max-w-[318px] px-4 py-2">
      <SearchBox
        search={search}
        callUser={callUser}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />
      <div className="flex flex-row min-w-20 gap-4 items-center">
        <div>
          <Listbox>
            <div>
              <Listbox.Button>
                <Button
                  variant="ghost"
                  className="flex items-center justify-center min-w-8 min-h-8 pt-1 pr-1 pb-1 pl-1"
                >
                  <FontAwesomeIcon
                    icon={ThemeMenuIcon}
                    className="h-5 w-5 dark:text-gray-50 text-gray-700"
                  />
                </Button>
              </Listbox.Button>
            </div>
            <Listbox.Options
              className={`dark:bg-bgDark bg-bgLight border dark:border-borderDark border-borderLight rounded-lg mt-2 fixed min-w-[225px] min-h-[145px] z-[200] translate-x-[calc(-100%+36px)]`}
            >
              <p className="dark:text-titleDark text-titleLight text-xs leading-[18px] py-1 px-4 mt-1">
                {t('Settings.Theme')}
              </p>
              {themeOptions.map((availableTheme) => (
                <Listbox.Option
                  key={availableTheme.id}
                  value={availableTheme}
                  className="cursor-pointer"
                >
                  <div
                    className={`flex flex-row items-center gap-4 dark:text-gray-50 text-gray-700 dark:hover:bg-hoverDark hover:bg-hoverLight mt-2 ${theme === availableTheme.name ? 'py-2 px-4' : 'py-2 pr-4 pl-12'} ${availableTheme.name === 'dark' ? 'dark:hover:rounded-bl-[8px] dark:hover:rounded-br-[8px] hover:rounded-bl-[8px] hover:rounded-br-[8px]' : ''}`}
                    onClick={() => handleSetTheme(availableTheme.name)}
                  >
                    {theme === availableTheme.name && (
                      <FontAwesomeIcon
                        className="dark:text-textBlueDark text-textBlueLight"
                        style={{ fontSize: '16px' }}
                        icon={ChooseThemeMenuIcon}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon className="text-base" icon={availableTheme.icon} />
                      <p className="font-normal">
                        {availableTheme.name === 'system'
                          ? t('Settings.System')
                          : availableTheme.name === 'light'
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
              <Menu.Button className="cursor-pointer">
                {operators?.avatars?.[account.username] ? (
                  <Avatar
                    size="small"
                    status={status}
                    src={operators?.avatars?.[account.username]}
                  />
                ) : (
                  <div className="flex items-center justify-center relative shrink-0 h-8 w-8 text-sm rounded-full border-2 border-borderLight dark:border-borderDark">
                    <FontAwesomeIcon
                      icon={DefaultAvatar}
                      className="text-[32px] dark:text-gray-50 text-gray-600"
                    />
                  </div>
                )}
              </Menu.Button>
            </div>

            <Menu.Items
              className={`dark:bg-bgDark bg-bgLight border dark:border-borderDark border-borderLight mt-2 fixed rounded-lg min-w-[225px] min-h-[125px] z-[200] translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div className="flex flex-col w-full py-[10px] px-6 border-b-[1px] dark:border-borderDark border-borderLight">
                  <p className="dark:text-gray-400 text-gray-700">{t('TopBar.Signed in as')}</p>
                  <div className="flex flex-row gap-4">
                    <p className="dark:text-titleDark text-titleLight font-medium">
                      {account.data?.name}
                    </p>
                    <p className="dark:text-gray-50 text-gray-700 font-normal">
                      {account.data?.endpoints.mainextension[0].id}
                    </p>
                    <p className="dark:text-gray-50 text-gray-700 font-normal">
                      [{account.data?.default_device.type}]
                    </p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item
                as={'div'}
                className="cursor-pointer dark:text-titleDark text-titleLight dark:hover:bg-hoverDark hover:bg-hoverLight"
              >
                <div
                  className="flex flex-row items-center gap-4 py-[10px] px-6"
                  onClick={goToNethVoicePage}
                >
                  <FontAwesomeIcon className="text-base" icon={GoToNethVoiceIcon} />
                  <p className="font-normal inline">{t('TopBar.Go to NethVoice CTI')}</p>
                </div>
              </Menu.Item>
              <Menu.Item
                as={'div'}
                className="cursor-pointer dark:text-titleDark text-titleLight dark:hover:bg-hoverDark hover:bg-hoverLight"
              >
                <div className="flex flex-row items-center gap-4 py-[10px] px-6" onClick={logout}>
                  <FontAwesomeIcon className="text-base" icon={LogoutIcon} />
                  <p className="font-normal">{t('TopBar.Logout')}</p>
                </div>
              </Menu.Item>
              <Menu.Item
                as={'div'}
                className="cursor-pointer dark:text-titleDark text-titleLight dark:hover:bg-hoverDark hover:bg-hoverLight rounded-b-lg"
              >
                <div
                  className="flex flex-row items-center gap-4 py-[10px] px-6"
                  onClick={exitNethLink}
                >
                  <FontAwesomeIcon className="text-base" icon={ExitIcon} />
                  <p className="font-normal">{'Quit'}</p>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div>
  )
}
