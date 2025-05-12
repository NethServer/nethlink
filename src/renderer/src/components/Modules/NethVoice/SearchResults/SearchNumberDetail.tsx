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
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CurstomThemedTooltip'
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
                <ContactVisibility isPublic={true} />
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Primary phone')}>
                  <LinkedValue type='phone'>{primaryNumber || ''}</LinkedValue>
                </ContactDetail>
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Home phone')}>
                  <LinkedValue type='phone'>{contact.homephone}</LinkedValue>
                </ContactDetail>
                <ContactDetail icon={MobilePhoneIcon} label={t('Phonebook.Mobile phone')}>
                  <LinkedValue type='phone'>{contact.cellphone}</LinkedValue>
                </ContactDetail>
                <ContactDetail icon={PhoneIcon} label={t('Phonebook.Work phone')}>
                  <LinkedValue type='phone'>{contact.workphone}</LinkedValue>
                </ContactDetail>
                <ContactDetail icon={MailIcon} label={t('Phonebook.Email')}>
                  <LinkedValue type='mail'>{contact.homeemail}</LinkedValue>
                </ContactDetail>
                <ContactDetail icon={WorkIcon} label={t('Phonebook.Company')}>
                  {contact.company}
                </ContactDetail>
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

const ContactDetail = ({ children, label, icon }: { label: string | DefaultTFuncReturn, icon: IconProp, children: ReactNode }) => {
  return <div className='flex flex-row w-full justify-start'>
    <div className='flex flex-row gap-2 items-center min-w-[170px] '>
      <FontAwesomeIcon
        className="text-base dark:text-titleDark text-titleLight"
        icon={icon}
      />
      {label}
    </div>
    <div className='relative truncate max-w-[calc(100%-170px)]'
      {
      ...(typeof children === 'string' ? {
        'data-tooltip-id': `tooltip-${label}`,
        'data-tooltip-content': children
      } : {})
      }
    >
      {children}
      {typeof children === 'string' && <CustomThemedTooltip id={`tooltip-${label}`} />
      }
    </div>
  </div>
}

const LinkedValue = ({ children, type, className }: { className?: string, children: string, type: 'phone' | 'mail' }) => {
  if (!children) return <></>

  const onClick = () => {
    const url = (type === 'phone' ? 'callto://' : 'mailto://') + `${children.replace(/ /g, '')}`
    window.api.openExternalPage(url);
  }

  return <div
    className={ClassNames(className, 'truncate cursor-pointer w-full flex flex-row items-center  text-textBlueLight dark:text-textBlueDark font-normal gap-2 dark:focus:outline-none dark:focus:ring-2 focus:outline-none focus:ring-2 dark:ring-offset-1 ring-offset-1 dark:ring-offset-slate-900 ring-offset-slate-50 focus:ring-primaryRing dark:focus:ring-primaryRingDark rounded-md hover:underline')}
    onClick={onClick}
  >
    <span className='truncate'
      data-tooltip-id={`tooltip-${children}`}
      data-tooltip-content={children}
    >
      {children}
    </span>
    <FontAwesomeIcon
      className="text-base"
      icon={CopyIcon}
    />
    <CustomThemedTooltip id={`tooltip-${children}`} />
  </div>

}