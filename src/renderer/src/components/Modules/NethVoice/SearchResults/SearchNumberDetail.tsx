import {
  faArrowLeft as BackIcon,
  faCopy as CopyIcon,
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
    contact: SearchData
    primaryNumber: string | null
  }
  onBack: () => void
}
export function SearchNumberDetail({
  contactDetail,
  onBack,
}: SearchNumberBoxProps) {
  const { contact } = contactDetail || {}
  return (
    <div
      className={ClassNames(
        'absolute top-0 w-full h-full left-0 duration-300 transition-transform',
        contact ? 'translate-x-0' : 'translate-x-[150%]',
      )}
    >
      {contact && (
        <div className='flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full'>
          {/* Title row: back arrow + name + visibility badge (mock 936-24158).
              px-4 matches the search box padding above (Navbar.tsx px-4 pt-2). */}
          <div className='px-4'>
            <div className='flex h-10 items-center gap-2 border-b border-borderLight dark:border-borderDark'>
              <button
                type='button'
                aria-label={t('Common.Back') as string}
                data-tooltip-id='tooltip-contact-back'
                data-tooltip-content={t('Common.Back') as string}
                className='-ml-1.5 flex size-7 shrink-0 items-center justify-center rounded-md text-gray-700 hover:bg-hoverLight dark:text-gray-200 dark:hover:bg-hoverDark focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
                onClick={() => {
                  debouncer(
                    'onDetailBack',
                    () => {
                      onBack()
                    },
                    250,
                  )
                }}
              >
                <FontAwesomeIcon
                  className='size-4'
                  icon={BackIcon}
                  aria-hidden='true'
                />
              </button>
              <CustomThemedTooltip id='tooltip-contact-back' place='bottom' />
              <h1
                className='min-w-0 flex-1 truncate text-base font-medium leading-6 text-titleLight dark:text-titleDark'
                data-tooltip-id='tooltip-contact-name'
                data-tooltip-content={contact?.displayName}
              >
                {contact?.displayName}
              </h1>
              <CustomThemedTooltip id='tooltip-contact-name' place='bottom' />
              <VisibilityBadge contact={contact} />
            </div>
          </div>
          <div className='h-full w-full px-4 pt-4'>
            <Scrollable>
              <div className='flex w-full flex-col gap-4 pb-4'>
                {contact.company && (
                  <ContactDetail label={t('Phonebook.Company')} plain>
                    {contact.company}
                  </ContactDetail>
                )}
                {contact.job && (
                  <ContactDetail label={t('Phonebook.Job title')} plain>
                    {contact.job}
                  </ContactDetail>
                )}
                {contact.extension && (
                  <ContactDetail
                    label={t('Phonebook.Extension')}
                    copy
                    protocol='callto'
                  >
                    {contact.extension}
                  </ContactDetail>
                )}
                {contact.workphone && (
                  <ContactDetail
                    label={t('Phonebook.Work phone')}
                    copy
                    protocol='callto'
                  >
                    {contact.workphone}
                  </ContactDetail>
                )}
                {contact.workphone2 && (
                  <ContactDetail
                    label={t('Phonebook.Work phone 2')}
                    copy
                    protocol='callto'
                  >
                    {contact.workphone2}
                  </ContactDetail>
                )}
                {contact.cellphone && (
                  <ContactDetail
                    label={t('Phonebook.Mobile phone')}
                    copy
                    protocol='callto'
                  >
                    {contact.cellphone}
                  </ContactDetail>
                )}
                {contact.cellphone2 && (
                  <ContactDetail
                    label={t('Phonebook.Mobile phone 2')}
                    copy
                    protocol='callto'
                  >
                    {contact.cellphone2}
                  </ContactDetail>
                )}
                {contact.homephone && (
                  <ContactDetail
                    label={t('Phonebook.Home phone')}
                    copy
                    protocol='callto'
                  >
                    {contact.homephone}
                  </ContactDetail>
                )}
                {contact.otherphone && (
                  <ContactDetail
                    label={t('Phonebook.Other phone')}
                    copy
                    protocol='callto'
                  >
                    {contact.otherphone}
                  </ContactDetail>
                )}
                {contact.fax && (
                  <ContactDetail
                    label={t('Phonebook.Fax')}
                    copy
                    protocol='callto'
                  >
                    {contact.fax}
                  </ContactDetail>
                )}
                {contact.workemail && (
                  <ContactDetail
                    label={t('Phonebook.Email')}
                    copy
                    protocol='mailto'
                  >
                    {contact.workemail}
                  </ContactDetail>
                )}
                {contact.homeemail && (
                  <ContactDetail
                    label={t('Phonebook.Home email')}
                    copy
                    protocol='mailto'
                  >
                    {contact.homeemail}
                  </ContactDetail>
                )}
                {contact.otheremail && (
                  <ContactDetail
                    label={t('Phonebook.Other email')}
                    copy
                    protocol='mailto'
                  >
                    {contact.otheremail}
                  </ContactDetail>
                )}
                {contact.facebook && (
                  <ContactDetail
                    label={t('Phonebook.Facebook')}
                    copy
                    href={getSocialUrl(contact.facebook)}
                  >
                    {contact.facebook}
                  </ContactDetail>
                )}
                {contact.instagram && (
                  <ContactDetail
                    label={t('Phonebook.Instagram')}
                    copy
                    href={getSocialUrl(contact.instagram)}
                  >
                    {contact.instagram}
                  </ContactDetail>
                )}
                {contact.linkedin && (
                  <ContactDetail
                    label={t('Phonebook.LinkedIn')}
                    copy
                    href={getSocialUrl(contact.linkedin)}
                  >
                    {contact.linkedin}
                  </ContactDetail>
                )}
                {contact.url && (
                  <ContactDetail
                    label={t('Phonebook.Website')}
                    copy
                    href={getSocialUrl(contact.url)}
                  >
                    {contact.url}
                  </ContactDetail>
                )}
                {contact.notes && (
                  <ContactDetail label={t('Phonebook.Notes')} plain>
                    {contact.notes}
                  </ContactDetail>
                )}
              </div>
            </Scrollable>
          </div>
        </div>
      )}
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
    const groupBadgeClassName = classNames(
      theme.badge.base,
      theme.badge.rounded.full,
      theme.badge.sizes.small,
      'w-fit justify-start bg-sky-100 dark:bg-sky-700 text-sky-800 dark:text-sky-100 flex flex-row gap-1 items-center',
    )

    return (
      <div className='flex flex-wrap gap-1 items-center justify-end shrink-0'>
        {visibleGroups.map((groupName) => (
          <div key={groupName} className={groupBadgeClassName}>
            <FontAwesomeIcon
              className='size-4 text-sky-800 dark:text-sky-100'
              icon={GroupIcon}
              aria-hidden='true'
            />
            {groupName}
          </div>
        ))}
        {remainingGroups.length > 0 && (
          <>
            <button
              type='button'
              aria-label={remainingGroups.join(', ')}
              className='rounded text-xs font-medium text-textBlueLight hover:text-primaryHover hover:underline dark:text-textBlueDark dark:hover:text-primaryDarkHover focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
              data-tooltip-id='tooltip-remaining-groups'
              data-tooltip-content={remainingGroups.join(', ')}
            >
              {t('Common.PlusOther', { count: remainingGroups.length })}
            </button>
            <CustomThemedTooltip id='tooltip-remaining-groups' place='bottom' />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className={classNames(
        theme.badge.base,
        theme.badge.rounded.full,
        theme.badge.sizes.small,
        'shrink-0 w-fit justify-start flex flex-row gap-1 items-center',
        visibility === 'private'
          ? 'bg-indigo-100 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-100'
          : 'bg-teal-100 dark:bg-teal-700 text-teal-800 dark:text-teal-100',
      )}
    >
      <FontAwesomeIcon
        aria-hidden='true'
        className={classNames(
          'size-4',
          visibility === 'private'
            ? 'text-indigo-800 dark:text-indigo-100'
            : 'text-teal-800 dark:text-teal-100',
        )}
        icon={visibility === 'private' ? PrivateIcon : PublicIcon}
      />
      {visibility === 'private'
        ? t('Phonebook.Only me')
        : t('Phonebook.Public')}
    </div>
  )
}

const ContactDetail = ({
  children,
  label,
  copy,
  protocol,
  href,
  plain,
}: {
  label: string | DefaultTFuncReturn
  children: string
  copy?: boolean
  protocol?: 'mailto' | 'callto'
  href?: string
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

  const linkClassName =
    'text-textBlueLight dark:text-textBlueDark hover:text-primaryHover dark:hover:text-primaryDarkHover cursor-pointer rounded-md font-normal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'

  const cleaned = ('' + children).replace(/ /g, '')
  const isCalltoDisabled = protocol === 'callto' && !isCallsEnabled

  const openExternal = () => {
    if (href) {
      window.api.openExternalPage(href)
    }
  }

  return (
    <div className='flex w-full flex-row items-start justify-start gap-4 text-sm'>
      <div className='w-24 shrink-0 text-gray-600 dark:text-gray-400'>
        {label}
      </div>
      <div className='relative flex flex-row flex-1 min-w-0 gap-2'>
        {plain ? (
          <div className='break-words text-titleLight dark:text-titleDark'>
            {children}
          </div>
        ) : href ? (
          <button
            type='button'
            className={classNames('truncate text-left', linkClassName)}
            onClick={openExternal}
          >
            {children}
          </button>
        ) : (
          <a
            href={`${protocol}:${protocol === 'callto' ? '//' : ''}${cleaned}`}
            className={classNames(
              'truncate',
              linkClassName,
              isCalltoDisabled ? 'cursor-not-allowed' : '',
            )}
          >
            {children}
          </a>
        )}

        {copy && (
          <div className='relative'>
            <button
              type='button'
              aria-label={t('Common.Copy') as string}
              className={classNames(linkClassName, 'flex items-center')}
              onClick={onCopy}
              data-tooltip-id={`tooltip-copy-${label}`}
              data-tooltip-content={t('Common.Copy') as string}
            >
              <FontAwesomeIcon
                className='size-4'
                icon={CopyIcon}
                aria-hidden='true'
              />
            </button>
            <div
              className='absolute left-1/2 top-0 z-0 w-0 h-full visible'
              data-tooltip-id={`tooltip-copied-${label}`}
              data-tooltip-content={t('Common.Copied')}
            />
          </div>
        )}
      </div>
      <CustomThemedTooltip
        id={`tooltip-copy-${label}`}
        place='bottom'
        className='z-10'
      />
      <CustomThemedTooltip
        id={`tooltip-copied-${label}`}
        place='top'
        className='z-10'
        isOpen={copied}
      />
    </div>
  )
}
