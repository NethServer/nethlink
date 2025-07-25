import {
  faArrowLeft as BackIcon,
  faClone as CopyIcon,
  faEarth as PublicIcon,
  faEye as VisibilityIcon,
  faPhone as PhoneIcon,
  faMobileScreen as MobilePhoneIcon,
  faBriefcase as WorkIcon,
  faEnvelope as MailIcon,
} from '@fortawesome/free-solid-svg-icons'
import { SearchData } from '@shared/types'
import { Scrollable } from '@renderer/components/Scrollable'
import { debouncer } from '@shared/utils/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DefaultTFuncReturn, t } from 'i18next'
import { ClassNames } from '@renderer/utils'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { useRef, useState } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { Tooltip } from 'react-tooltip'
import { NumberCaller } from '@renderer/components/NumberCaller'
import { useAccount } from '@renderer/hooks/useAccount'
import classNames from 'classnames'
import { useTheme } from '@renderer/theme/Context'

interface SearchNumberBoxProps {
  contactDetail?: {
    contact: SearchData,
    primaryNumber: string | null
  },
  onBack: () => void
}
export function SearchNumberDetail({ contactDetail, onBack }: SearchNumberBoxProps) {
  const { contact, primaryNumber } = contactDetail || {}
  return (
    <div className={ClassNames('absolute top-0 w-full h-full left-0 duration-300 transition-transform', contact ? 'translate-x-0' : 'translate-x-[150%]')}>
      {contact &&
        <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full">
          <ModuleTitle
            className='flex-row-reverse justify-end'
            title={
              contact?.displayName
            }
            actionComponent={
              <FontAwesomeIcon
                className="text-base dark:text-gray-50 text-gray-600 mr-1 p-1 size-4 cursor-pointer"
                icon={BackIcon}
                onClick={() => {
                  debouncer('onDetailBack', () => {
                    onBack()
                  }, 250)
                }}
              />
            }
          />
          <div className='pl-6 pt-6 w-full h-full'>
            <Scrollable>
              <div className='flex flex-col gap-6 w-full pr-1'>
                <ContactVisibility isPublic={!(contact?.type === 'private' && contact?.source === 'cti')} />
                {/* <ContactDetail icon={PhoneIcon} label={t('Phonebook.Primary phone')} copy>{primaryNumber || ''}</ContactDetail> */}
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Home phone')} copy protocol='callto'>{contact.homephone}</ContactDetail>
                <ContactDetail icon={MobilePhoneIcon} label={t('Phonebook.Mobile phone')} copy protocol='callto'>{contact.cellphone}</ContactDetail>
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Work phone')} copy protocol='callto'>{contact.workphone}</ContactDetail>
                <ContactDetail icon={MailIcon} label={t('Phonebook.Email')} copy protocol='mailto'>{contact.homeemail}</ContactDetail>
                <ContactDetail icon={MailIcon} label={t('Phonebook.Work')} copy protocol='mailto'>{contact.workemail}</ContactDetail>
                <ContactDetail icon={WorkIcon} label={t('Phonebook.Company')}>{contact.company}</ContactDetail>
              </div>
            </Scrollable>
          </div>
        </div>
      }
    </div>
  )
}


const ContactVisibility = ({ isPublic }: { isPublic: boolean }) => {
  const { theme } = useTheme()
  return <div className='flex flex-row w-full justify-start'>
    <div className='flex flex-row gap-2 items-center min-w-[170px] w-full dark:text-titleDark text-titleLight'>
      <FontAwesomeIcon
        className="text-base dark:text-titleDark text-titleLight"
        icon={VisibilityIcon}
      />
      {t("Phonebook.Visibility")}
    </div>
    <div className='w-full'>
      <div className={classNames(theme.badge.base, theme.badge.rounded.full, theme.badge.sizes.small, 'w-fit justify-start bg-teal-100 dark:bg-teal-700  text-teal-800 dark:text-teal-100 flex flex-row gap-1 items-center ')}>
        <FontAwesomeIcon
          className="text-base text-teal-800 dark:text-teal-100 w-5"
          icon={PublicIcon}
        />
        {isPublic ? t("Phonebook.Public") : t("Phonebook.Only me")}
      </div>
    </div>
  </div>
}

const ContactDetail = ({ children, label, icon, copy, protocol }: { label: string | DefaultTFuncReturn, icon: IconProp, children: string, copy?: boolean, protocol?: 'mailto' | 'callto' }) => {

  const { isCallsEnabled } = useAccount()
  const [copied, setCopied] = useState(false)
  const copiedInterval = useRef<NodeJS.Timeout>()

  const removeInterval = () => {
    if (copiedInterval.current) {
      clearTimeout(copiedInterval.current)
    }
  }
  const onClick = () => {
    window.api.copyToClipboard(children)
    setCopied(true)
    copiedInterval.current = setTimeout(() => {
      setCopied(false)
      removeInterval()
    }, 2000)
  }

  const runProtocol = () => {
    if (protocol === 'callto' && !isCallsEnabled) return;
    const url = `${protocol}:${protocol === 'callto' ? '//' : ''}${('' + children).replace(/ /g, '')}`
    window.api.openExternalPage(url);
  }

  const linkClassName = 'text-textBlueLight dark:text-textBlueDark cursor-pointer rounded-md font-normal dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark hover:underline'


  return <div className='flex flex-row w-full justify-start'>
    <div className='flex flex-row gap-2 items-center min-w-[170px] '>
      <FontAwesomeIcon
        className="text-base dark:text-titleDark text-titleLight w-5"
        icon={icon}
      />
      {label}
    </div>
    <div className='relative flex flex-row truncate max-w-[calc(100%-170px)] gap-2'>
      <a
        href={`callto://${('' + children).replace(/ /g, '')}`}
        className={classNames('truncate', protocol && children
          ? linkClassName
          : '',
          protocol === 'callto'
            ? isCallsEnabled
              ? ''
              : 'cursor-not-allowed'
            : ''
        )}
      >
        <div
          className={`'dark:text-titleDark text-titleLight font-normal`}
        >
          {children}
        </div>
      </a>

      {children && copy && <div className='relative'>
        <FontAwesomeIcon
          className={classNames(linkClassName, "text-base !ring-0 !ring-offset-0 border-0 inset-0 mr-1")}
          icon={CopyIcon}
          onClick={onClick}
          data-tooltip-id={`tooltip-copy-${label}`}
          data-tooltip-content={t('Common.Copy')}
        />
        <div className='absolute left-1/2 top-0 z-0 w-0 h-full  visible'
          data-tooltip-id={`tooltip-copied-${label}`}
          data-tooltip-content={t('Common.Copied')}
        />
      </div>
      }
    </div>
    <Tooltip
      id={`tooltip-data-${label}`}
      place="bottom"
      className="z-10"
      opacity={1}
      noArrow={false}
    />
    <Tooltip
      id={`tooltip-copy-${label}`}
      place="bottom"
      className="z-10"
      opacity={1}
      noArrow={false}
    />
    <Tooltip
      id={`tooltip-copied-${label}`}
      place="top"
      className="z-10"
      opacity={1}
      isOpen={copied}
      noArrow={false}
    />
  </div>
}

