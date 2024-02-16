import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchBox } from './SearchBox'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import { Button, Avatar } from '@nethesis/react-components/src/components/common'
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
    <div className="flex flex-row justify-between gap-4 min-w-[318px] min-h-[38px]">
      <SearchBox handleSearch={handleSearch} handleReset={handleReset} />
      <div className="flex flex-row min-w-20 gap-4 items-center">
        <Button onClick={openSettings} className="min-w-8 min-h-8 border-none pt-0 pr-0 pb-0 pl-0">
          <FontAwesomeIcon icon={faSliders} className="h-5 w-5" />
        </Button>
        <Avatar size="small" status="online" className="bg-white" onClick={showSignOutModal} />
      </div>
    </div>
  )
}
