import { Account, ParkingType } from "@shared/types";
import {
  faSquareParking as ParkedCallIcon,
  faPhone as CallIcon
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@renderer/components/Nethesis";
import { t } from "i18next";
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from "react";
import { isEmpty } from "lodash";
import { useAccount } from "@renderer/hooks/useAccount";
import { useStoreState } from "@renderer/store";
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI";

export interface ParkingCallProps {
  parkingDetails: ParkingType,
  onPickup: (parkingDetails: ParkingType) => Promise<void>
}
export const ParkedCall = ({ parkingDetails, onPickup }: ParkingCallProps) => {
  const [time, setTime] = useState(parkingDetails.parkedCaller?.timeout);
  const [cardPressStates, setCardPressStates] = useState<boolean>(false)
  const [status, setStatus] = useState('begin');

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime === Math.ceil(parkingDetails.timeout / 2)) {
          setStatus('middle');
        }
        if (prevTime === Math.ceil(parkingDetails.timeout / 4)) {
          setStatus('end');
        }
        if (prevTime === 0) {
          clearInterval(interval);
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [parkingDetails.timeout]);

  const formattedTime = new Date(time * 1000).toISOString().slice(14, 19);
  const nameText = useRef<null | HTMLDivElement>(null)
  const animationControls: any = useRef(null)




  const handleButtonDown = (index) => {
    if (!cardPressStates) {
      setCardPressStates(true)
      animationControls.current = setTimeout(() => {
        longPressHandler(parkingDetails)
      }, 2000)
    }
  }

  const handleButtonUp = (index) => {
    setCardPressStates(false)
    if (animationControls.current) {
      clearTimeout(animationControls.current)
    }
    resetAnimation()
  }

  const longPressHandler = (parkingDetails: any) => {
    onPickup(parkingDetails)
    resetAnimation()
  }

  const resetAnimation = () => {
    animationControls.current = null
  }

  return (
    <div className="relative flex flex-row justify-between items-center min-h-[44px] py-2 text-titleLight dark:text-titleDark">
      <div className="flex flex-col gap-0">
        <div className="flex flex-row items-center text-sm text-textYellowLight dark:text-textYellowDark gap-2">
          <FontAwesomeIcon size="1x" icon={ParkedCallIcon} className="text-[14px]" />
          <span>
            {t('Parks.Parking')} {parkingDetails.name}
          </span>
        </div>
        <span className='text-sm text-left text-gray-900 dark:text-gray-100 w-44 truncate tooltip-parked-user'>
          <div className='scrolling-text-container' ref={nameText}>
            {nameText?.current?.clientWidth && nameText?.current?.clientWidth > 180 ? (
              <>
                <div className='scrolling-text'>{parkingDetails?.parkedCaller?.name}</div>
                <div className='scrolling-text'>{parkingDetails?.parkedCaller?.name}</div>
              </>
            ) : (
              <>
                <div >{parkingDetails?.parkedCaller?.name}</div>
              </>
            )}
          </div>
        </span>
      </div>
      <div>
        <span
          className={`${status === 'begin'
            ? 'text-titleLight dark:text-titleDark'
            : status === 'middle'
              ? 'text-amber-700 dark:text-amber-500'
              : 'text-red-700 dark:text-red-500'
            } w-12 font-mono`}
        >
          {formattedTime}
        </span>
      </div>
      <div className='flex-grow' />
      <div
        className='relative w-20 mr-5'
        onMouseDown={handleButtonDown}
        onMouseUp={handleButtonUp}
        onMouseLeave={handleButtonUp}
      >
        <Button variant='white' className='tooltip-parking-button'>
          <FontAwesomeIcon
            icon={CallIcon}
            className='h-4 w-4 text-gray-500 dark:text-gray-200 mr-2'
          />
          <span className='w-14 overflow-hidden whitespace-nowrap'>
            {cardPressStates ? `${t('Parks.Hold')}` : `${t('Parks.Pick up')}`}
          </span>
        </Button>
        <motion.div
          initial={{ width: 0 }}
          animate={
            cardPressStates
              ? { width: '100%', transition: { duration: 2 } }
              : { width: 0 }
          }
          className='absolute top-0 left-0 w-full h-8 bg-emerald-500 rounded-md overflow-hidden'
        >
          <motion.button
            className='w-full h-full bg-transparent text-emerald-500 hover:text-emerald-600 rounded-md focus:outline-none'
            onMouseDown={handleButtonDown}
            onMouseUp={handleButtonUp}
            onMouseLeave={handleButtonUp}
          >
            <div className='flex items-center pl-2'>
              <FontAwesomeIcon
                icon={CallIcon}
                className='h-4 w-4 text-gray-100 dark:text-gray-200 ml-2 mr-2 '
              />
              <span className='text-gray-100 text-base overflow-hidden whitespace-nowrap'>{t('Parks.Hold')}</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>

  )
}
