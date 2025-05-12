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
import { ReactNode } from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { Tooltip } from 'react-tooltip'

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
    <div className={ClassNames('absolute top-0 w-full h-full left-0 duration-300 transition-transform z-0', contact ? 'translate-x-0' : 'translate-x-[150%]')}>
      {contact &&
        <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full">
          <ModuleTitle
            title={
              <div
                className={`flex gap-1 pt-[10px] pl-1 pr-8 pb-[10px] items-center cursor-pointer`}
                onClick={() => {
                  debouncer('onDetailBack', () => {
                    onBack()
                  }, 250)
                }}
              >
                <FontAwesomeIcon
                  className="text-base dark:text-gray-50 text-gray-600 mr-1"
                  icon={BackIcon}
                />
                <p className="font-normal">
                  {contact?.displayName}
                </p>
              </div>
            }
          />
          <div className='pl-6 pt-6 w-full h-full'>
            <Scrollable>
              <div className='flex flex-col gap-6 w-full pr-1'>
                <ContactVisibility isPublic={!(contact?.type === 'private' && contact?.source === 'cti')} />
                {/* <ContactDetail icon={PhoneIcon} label={t('Phonebook.Primary phone')} copy>{primaryNumber || ''}</ContactDetail> */}
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Home phone')} copy>{contact.homephone}</ContactDetail>
                <ContactDetail icon={MobilePhoneIcon} label={t('Phonebook.Mobile phone')} copy>{contact.cellphone}</ContactDetail>
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Work phone')} copy>{contact.workphone}</ContactDetail>
                <ContactDetail icon={MailIcon} label={t('Phonebook.Email')} copy>{contact.homeemail}</ContactDetail>
                <ContactDetail icon={MailIcon} label={t('Phonebook.Work')} copy>{contact.workemail}</ContactDetail>
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
  return <div className='flex flex-row w-full justify-start'>
    <div className='flex flex-row gap-2 items-center min-w-[170px] w-full'>
      <FontAwesomeIcon
        className="text-base dark:text-titleDark text-titleLight"
        icon={VisibilityIcon}
      />
      {t("Phonebook.Visibility")}
    </div>
    <div className='w-full'>
      <div className='px-3 py-0.5 w-fit justify-start bg-bgEmerald rounded-full flex flex-row gap-1 items-center dark:text-titleDark text-titleLight'>
        <FontAwesomeIcon
          className="text-base dark:text-titleDark text-titleLight"
          icon={PublicIcon}
        />
        {isPublic ? t("Phonebook.Public") : t("Phonebook.Only me")}
      </div>
    </div>
  </div>
}

const ContactDetail = ({ children, label, icon, copy }: { label: string | DefaultTFuncReturn, icon: IconProp, children: string, copy?: boolean }) => {
  return <div className='flex flex-row w-full justify-start'>
    <div className='flex flex-row gap-2 items-center min-w-[170px] '>
      <FontAwesomeIcon
        className="text-base dark:text-titleDark text-titleLight"
        icon={icon}
      />
      {label}
    </div>
    <div className='relative truncate max-w-[calc(100%-170px)]'
      data-tooltip-id={`tooltip-${label}`}
      data-tooltip-content={children}
      data-tooltip-place={'bottom'}

    >
      {copy ? <CopyValue >{children}</CopyValue> : (children || '-')}
      <Tooltip
        id={`tooltip-${label}`}
        place="bottom"
        className="z-10"
        opacity={1}
        noArrow={false}
      />

    </div>
  </div>
}

const CopyValue = ({ children, className }: { className?: string, children: string }) => {
  if (!children) return <>-</>

  const onClick = () => {
    window.api.copyToClipboard(children)
  }

  return <div
    className={ClassNames(className, 'relative cursor-pointer w-full flex flex-row items-center  text-textBlueLight dark:text-textBlueDark font-normal gap-2 dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-md hover:underline')}
    onClick={onClick}
  >
    <span className='truncate'
    >
      {children}
    </span>
    <FontAwesomeIcon
      className="text-base"
      icon={CopyIcon}
    />

  </div>

}
