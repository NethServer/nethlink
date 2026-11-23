import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { TimedComponent } from './TimedComponent'

export interface EmptyListProps {
  icon: IconProp
  text: string
  subtitle?: string
}
export const EmptyList = ({ icon, text, subtitle }: EmptyListProps) => {
  return (
    <TimedComponent timer={100}>
      <div className='mx-4 mt-4 flex flex-col items-center justify-center gap-4 rounded-lg bg-elevationL2 px-4 py-8 dark:bg-elevationL2Dark'>
        <FontAwesomeIcon
          icon={icon}
          className='size-12 text-emptyIconLight dark:text-emptyIconDark'
          aria-hidden='true'
        />
        <div className='flex w-full flex-col items-center gap-1'>
          <span className='text-center text-sm font-medium leading-5 text-emptyTextLight dark:text-emptyTextDark'>
            {text}
          </span>
          {subtitle && (
            <span className='text-center text-sm leading-5 text-gray-600 dark:text-gray-400'>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </TimedComponent>
  )
}
