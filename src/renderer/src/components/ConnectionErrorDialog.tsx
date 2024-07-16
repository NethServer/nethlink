import { faWarning } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { t } from "i18next"
import { Button } from "./Nethesis"
import classNames from "classnames"
import { useTheme } from "@renderer/theme/Context"


interface ConnectionErrorDialogProps {
  onButtonClick: () => void,
  buttonText: string,

  variant: 'splashscreen' | 'nethlink'
  className?: string
}
export const ConnectionErrorDialog = ({ buttonText, onButtonClick, variant, className }: ConnectionErrorDialogProps) => {

  const { theme } = useTheme()

  return (
    <>
      <div className={classNames(
        theme.connectionErrorDialog.backdrop.base,
        theme.connectionErrorDialog.backdrop.variant[variant]
      )}></div>
      <div className={classNames(
        theme.connectionErrorDialog.dialog.base,
        theme.connectionErrorDialog.dialog.variant[variant],
        className
      )}>
        <div className='w-[340px] h-[232px] m-auto z-[1000] text-center dark:text-bgLight text-bgDark dark:bg-bgDark bg-bgLight rounded-lg flex flex-col justify-between items-center p-6'>
          <div className='rounded-full w-12 h-12 p-3 bg-bgAmberLight dark:bg-bgAmberDark'>
            <FontAwesomeIcon icon={faWarning} className='relative w-6 h-6 top-[-1px] text-iconAmberLight dark:text-iconAmberDark' />
          </div>
          <div className='flex flex-col'>
            <h3 className="font-medium text-[18px] leading-7 text-titleLight dark:text-titleDark">{t('Common.No internet connection title')}</h3>
            <p className="mt-3 font-normal text-[14px] leading-5 text-gray-700 dark:text-gray-200">{t('Common.No internet connection description')}</p>
          </div>
          <Button className='w-full' onClick={onButtonClick}>{buttonText}</Button>
        </div>
      </div>
    </>
  )
}
