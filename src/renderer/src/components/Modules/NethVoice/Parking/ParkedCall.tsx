import { ParkingType } from "@shared/types";
import {
  faSquareParking as ParkedCallIcon,
  faPhone as CallIcon
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@renderer/components/Nethesis";
import { t } from "i18next";
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { Tooltip } from 'react-tooltip'

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
        if (prevTime <= Math.ceil(parkingDetails.timeout / 2)) {
          setStatus('middle');
        }
        if (prevTime <= Math.ceil(parkingDetails.timeout / 4)) {
          setStatus('end');
        }
        if (prevTime <= 0) {
          clearInterval(interval);
          return 0
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [parkingDetails.timeout]);

  const formattedTime = new Date(time * 1000).toISOString().slice(14, 19);
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
    <div className="relative flex flex-row justify-end items-center min-h-[44px] py-2 ">
      <div className="relative min-w-[calc(100%-200px)] min-h-[44px]">
        <div className="absolute flex flex-col justify-start gap-0 w-full top-0 left-0">
          <div className="flex flex-row items-center text-sm text-textYellowLight dark:text-textYellowDark gap-2">
            <FontAwesomeIcon size="1x" icon={ParkedCallIcon} className="text-[14px]" />
            <span className={`text-sm text-left truncate tooltip-parked-title-${parkingDetails.name}`}>
              {t('Parks.Parking')} {parkingDetails.name}
            </span>
            <Tooltip anchorSelect={`.tooltip-parked-title-${parkingDetails.name}`} place="bottom"
              className="z-[100000]"
              opacity={1}
              noArrow={false}>
              {t('Parks.Parking')} {parkingDetails.name}
            </Tooltip>
          </div>
          <span className={`text-sm text-left text-gray-900 dark:text-gray-100 truncate tooltip-parked-user-${parkingDetails.name} `}>
            {parkingDetails?.parkedCaller?.name}
          </span>
          <Tooltip anchorSelect={`.tooltip-parked-user-${parkingDetails.name}`} place="bottom"
            className="z-[100000]"
            opacity={1}
            noArrow={false}>
            {parkingDetails?.parkedCaller?.name}
          </Tooltip>
        </div>
      </div>
      <div className="flex flex-row justify-end gap-6 items-center min-w-[200px] min-h-[44px]">
        <span
          className={classNames(status === 'begin'
            ? 'text-titleLight dark:text-titleDark'
            : status === 'middle'
              ? 'text-amber-700 dark:text-amber-500'
              : 'text-red-700 dark:text-red-500',
            'w-10 font-mono min-w-10')}
        >
          {formattedTime}
        </span>
        <div
          className='relative w-28'
          onMouseDown={handleButtonDown}
          onMouseUp={handleButtonUp}
          onMouseLeave={handleButtonUp}
        >

          <motion.div
            initial={{ width: 0 }}
            animate={
              cardPressStates
                ? { width: '100%', transition: { duration: 2 } }
                : { width: 0 }
            }
            className='absolute top-[1px] left-0 w-full min-h-[44px] bg-emerald-500 rounded-md overflow-hidden'
          >
          </motion.div>
          <Button variant='white' className={classNames('tooltip-parking-button min-w-28 min-h-[44px]')} >
            <FontAwesomeIcon
              icon={CallIcon}
              className={classNames('h-4 w-4 mr-2', cardPressStates ? 'text-gray-500 dark:text-gray-200' : 'textBlueLight dark:textBlueDark')}
            />
            <span className={classNames('w-16 overflow-hidden whitespace-nowrap', cardPressStates ? 'text-gray-500 dark:text-gray-200' : 'textBlueLight dark:textBlueDark')}>
              {cardPressStates ? `${t('Parks.Hold')}` : `${t('Parks.Pick up')}`}
            </span>
          </Button>
        </div>
      </div>

    </div>

  )
}
