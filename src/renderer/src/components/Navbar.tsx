import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { Button } from './common/Button'
import { Avatar } from './common/Avatar'

export interface NavabarProps {
  openSettings: () => void
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
  showSignOutModal: () => void
}

export function Navbar({
  openSettings,
  handleSearch,
  handleReset,
  showSignOutModal
}: NavabarProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between gap-4 min-h-[38px]">
      <SearchBox handleSearch={handleSearch} handleReset={handleReset} />
      <div className="flex flex-row w-full gap-4 items-center">
        <Button onClick={openSettings} className="min-w-8 min-h-8 p-[6px] border-none">
          <FontAwesomeIcon icon={faSliders} className="h-5 w-5" />
        </Button>
        <Avatar
          src={''}
          size="small"
          status="online"
          onClick={showSignOutModal}
          className="h-8 w-8 bg-white"
        />
      </div>
    </div>
  )
}
