import {
  faArrowLeft as BackIcon,
  faClone as CopyIcon,
  faEarth as PublicIcon,
  faUserGroup as GroupIcon,
  faUserLock as PrivateIcon,
} from '@fortawesome/free-solid-svg-icons'
import { SearchData } from '@shared/types'
import { Scrollable } from '@renderer/components/Scrollable'
import { debouncer } from '@shared/utils/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DefaultTFuncReturn, t } from 'i18next'
import { ClassNames } from '@renderer/utils'
import { useRef, useState } from 'react'
import { useAccount } from '@renderer/hooks/useAccount'
import classNames from 'classnames'
import { useTheme } from '@renderer/theme/Context'
import { getContactSharedGroups, getContactVisibility } from '@shared/phonebook'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

// Normalize a social/website value into an openable URL (mirrors the CTI helper):
// keep absolute http(s) URLs as-is, otherwise prefix https://.
const getSocialUrl = (value: string) => {
  if (!value) return ''
  const trimmed = ('' + value).trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

interface SearchNumberBoxProps {
  contactDetail?: {
    contact: SearchData,
    primaryNumber: string | null
  },
  onBack: () => void
}
export function SearchNumberDetail({ contactDetail, onBack }: SearchNumberBoxProps) {
  const { contact } = contactDetail || {}
  return (
    <div className={ClassNames('absolute top-0 w-full h-full left-0 duration-300 transition-transform', contact ? 'translate-x-0' : 'translate-x-[150%]')}>
      {contact &&
        <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full">
          {/* Title row: back arrow + name + visibility badge (mock 936-24158).
              px-4 matches the search box padding above (Navbar.tsx px-4 pt-2). */}
          <div className="px-4">
            <div className="flex items-center gap-2 pt-2 pb-2 border-b dark:border-borderDark border-borderLight min-h-[28px]">
              <FontAwesomeIcon
                className="text-base dark:text-gray-50 text-gray-600 size-4 shrink-0 cursor-pointer"
                icon={BackIcon}
                onClick={() => {
                  debouncer('onDetailBack', () => {
                    onBack()
                  }, 250)
                }}
              />
              <h1
                className="flex-1 min-w-0 font-medium text-base leading-5 dark:text-titleDark text-titleLight truncate"
                data-tooltip-id="tooltip-contact-name"
                data-tooltip-content={contact?.displayName}
              >
                {contact?.displayName}
              </h1>
              <CustomThemedTooltip id="tooltip-contact-name" place="bottom" />
              <VisibilityBadge contact={contact} />
            </div>
          </div>
          <div className='px-4 pt-6 w-full h-full'>
            <Scrollable>
              <div className='flex flex-col gap-6 w-full pr-1'>
                {contact.company && <ContactDetail label={t('Phonebook.Company')} plain>{contact.company}</ContactDetail>}
                {contact.job && <ContactDetail label={t('Phonebook.Job title')} plain>{contact.job}</ContactDetail>}
                {contact.extension && <ContactDetail label={t('Phonebook.Extension')} copy protocol='callto'>{contact.extension}</ContactDetail>}
                {contact.workphone && <ContactDetail label={t('Phonebook.Work phone')} copy protocol='callto'>{contact.workphone}</ContactDetail>}
                {contact.workphone2 && <ContactDetail label={t('Phonebook.Work phone 2')} copy protocol='callto'>{contact.workphone2}</ContactDetail>}
                {contact.cellphone && <ContactDetail label={t('Phonebook.Mobile phone')} copy protocol='callto'>{contact.cellphone}</ContactDetail>}
                {contact.cellphone2 && <ContactDetail label={t('Phonebook.Mobile phone 2')} copy protocol='callto'>{contact.cellphone2}</ContactDetail>}
                {contact.homephone && <ContactDetail label={t('Phonebook.Home phone')} copy protocol='callto'>{contact.homephone}</ContactDetail>}
                {contact.otherphone && <ContactDetail label={t('Phonebook.Other phone')} copy protocol='callto'>{contact.otherphone}</ContactDetail>}
                {contact.fax && <ContactDetail label={t('Phonebook.Fax')} copy protocol='callto'>{contact.fax}</ContactDetail>}
                {contact.workemail && <ContactDetail label={t('Phonebook.Email')} copy protocol='mailto'>{contact.workemail}</ContactDetail>}
                {contact.homeemail && <ContactDetail label={t('Phonebook.Home email')} copy protocol='mailto'>{contact.homeemail}</ContactDetail>}
                {contact.otheremail && <ContactDetail label={t('Phonebook.Other email')} copy protocol='mailto'>{contact.otheremail}</ContactDetail>}
                {contact.facebook && <ContactDetail label={t('Phonebook.Facebook')} copy href={getSocialUrl(contact.facebook)}>{contact.facebook}</ContactDetail>}
                {contact.instagram && <ContactDetail label={t('Phonebook.Instagram')} copy href={getSocialUrl(contact.instagram)}>{contact.instagram}</ContactDetail>}
                {contact.linkedin && <ContactDetail label={t('Phonebook.LinkedIn')} copy href={getSocialUrl(contact.linkedin)}>{contact.linkedin}</ContactDetail>}
                {contact.url && <ContactDetail label={t('Phonebook.Website')} copy href={getSocialUrl(contact.url)}>{contact.url}</ContactDetail>}
                {contact.notes && <ContactDetail label={t('Phonebook.Notes')} plain>{contact.notes}</ContactDetail>}
              </div>
            </Scrollable>
          </div>
        </div>
      }
    </div>
  )
}

// Cap inline group badges to leave room for the contact name in the title row;
// remaining groups collapse into a single "+N more" link with a bounded tooltip.
const VISIBLE_GROUPS_LIMIT = 1

const VisibilityBadge = ({ contact }: { contact: SearchData }) => {
  const { theme } = useTheme()
  const visibility = getContactVisibility(contact)
  const sharedGroups = getContactSharedGroups(contact)

  if (visibility === 'group') {
    const visibleGroups = sharedGroups.slice(0, VISIBLE_GROUPS_LIMIT)
    const remainingGroups = sharedGroups.slice(VISIBLE_GROUPS_LIMIT)
    const groupBadgeClassName = classNames(theme.badge.base, theme.badge.rounded.full, theme.badge.sizes.small, 'w-fit justify-start bg-sky-100 dark:bg-sky-700 text-sky-800 dark:text-sky-100 flex flex-row gap-1 items-center')

    return <div className='flex flex-wrap gap-1 items-center justify-end shrink-0'>
      {visibleGroups.map((groupName) => (
        <div key={groupName} className={groupBadgeClassName}>
          <FontAwesomeIcon className="text-base text-sky-800 dark:text-sky-100 w-4" icon={GroupIcon} />
          {groupName}
        </div>
      ))}
      {remainingGroups.length > 0 && (
        <>
          <span
            className="dark:text-textBlueDark text-textBlueLight hover:text-primaryHover dark:hover:text-primaryDarkHover font-medium text-[12px] leading-4 cursor-pointer hover:underline"
            data-tooltip-id="tooltip-remaining-groups"
            data-tooltip-content={remainingGroups.join(', ')}
          >
            {t('Common.PlusOther', { count: remainingGroups.length })}
          </span>
          <CustomThemedTooltip id="tooltip-remaining-groups" place="bottom" />
        </>
      )}
    </div>
  }

  return <div className={classNames(theme.badge.base, theme.badge.rounded.full, theme.badge.sizes.small, 'shrink-0 w-fit justify-start flex flex-row gap-1 items-center', visibility === 'private' ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-100' : 'bg-teal-100 dark:bg-teal-700 text-teal-800 dark:text-teal-100')}>
    <FontAwesomeIcon
      className={classNames('text-base w-4', visibility === 'private' ? 'text-indigo-800 dark:text-indigo-100' : 'text-teal-800 dark:text-teal-100')}
      icon={visibility === 'private' ? PrivateIcon : PublicIcon}
    />
    {visibility === 'private' ? t("Phonebook.Only me") : t("Phonebook.Public")}
  </div>
}

const ContactDetail = ({ children, label, copy, protocol, href, plain }: {
  label: string | DefaultTFuncReturn,
  children: string,
  copy?: boolean,
  protocol?: 'mailto' | 'callto',
  href?: string,
  plain?: boolean
}) => {
  const { isCallsEnabled } = useAccount()
  const [copied, setCopied] = useState(false)
  const copiedInterval = useRef<NodeJS.Timeout>()

  if (!children) return null

  const removeInterval = () => {
    if (copiedInterval.current) {
      clearTimeout(copiedInterval.current)
    }
  }
  const onCopy = () => {
    window.api.copyToClipboard(children)
    setCopied(true)
    copiedInterval.current = setTimeout(() => {
      setCopied(false)
      removeInterval()
    }, 2000)
  }

  const linkClassName = 'text-textBlueLight dark:text-textBlueDark hover:text-primaryHover dark:hover:text-primaryDarkHover cursor-pointer rounded-md font-normal dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark hover:underline'

  const cleaned = ('' + children).replace(/ /g, '')
  const isCalltoDisabled = protocol === 'callto' && !isCallsEnabled

  const openExternal = () => {
    if (href) {
      window.api.openExternalPage(href)
    }
  }

  return <div className='flex flex-row gap-6 items-start w-full justify-start'>
    <div className='w-[100px] shrink-0 font-normal text-[14px] leading-5 text-gray-600 dark:text-gray-400'>
      {label}
    </div>
    <div className='relative flex flex-row flex-1 min-w-0 gap-2'>
      {plain ? (
        <div className='dark:text-titleDark text-titleLight font-normal text-[14px] leading-5 break-words'>
          {children}
        </div>
      ) : href ? (
        <span
          className={classNames('truncate', linkClassName)}
          onClick={openExternal}
        >
          {children}
        </span>
      ) : (
        <a
          href={`${protocol}:${protocol === 'callto' ? '//' : ''}${cleaned}`}
          className={classNames('truncate', linkClassName, isCalltoDisabled ? 'cursor-not-allowed' : '')}
        >
          {children}
        </a>
      )}

      {copy && <div className='relative'>
        <FontAwesomeIcon
          className={classNames(linkClassName, 'text-base !ring-0 !ring-offset-0 border-0 inset-0 mr-1')}
          icon={CopyIcon}
          onClick={onCopy}
          data-tooltip-id={`tooltip-copy-${label}`}
          data-tooltip-content={t('Common.Copy')}
        />
        <div className='absolute left-1/2 top-0 z-0 w-0 h-full visible'
          data-tooltip-id={`tooltip-copied-${label}`}
          data-tooltip-content={t('Common.Copied')}
        />
      </div>
      }
    </div>
    <CustomThemedTooltip id={`tooltip-copy-${label}`} place="bottom" className="z-10" />
    <CustomThemedTooltip id={`tooltip-copied-${label}`} place="top" className="z-10" isOpen={copied} />
  </div>
}
