import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowUpRightFromSquare as GoToNethVoiceIcon
} from '@fortawesome/free-solid-svg-icons'
import { t } from "i18next"
export const NethVoiceLink = () => {

  function handleGoToNethVoicePage() {
    window.api.openHostPage('/')
  }

  return (
    <div
      className="flex flex-row items-center gap-4 py-[10px] px-4"
      onClick={handleGoToNethVoicePage}
    >
      <FontAwesomeIcon className="text-base" icon={GoToNethVoiceIcon} />
      <p className="font-normal inline">{t('TopBar.Go to NethVoice CTI')}</p>
    </div>
  )
}
