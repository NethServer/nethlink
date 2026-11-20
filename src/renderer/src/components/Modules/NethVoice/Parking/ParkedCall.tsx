import { ParkingType } from '@shared/types'
import {
  faSquareParking as ParkedCallIcon,
  faPhone as CallIcon,
  faTriangleExclamation as UrgencyIcon,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from '@renderer/components/Nethesis'
import { t } from 'i18next'
import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import classNames from 'classnames'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

export interface ParkingCallProps {
  parkingDetails: ParkingType
  onPickup: (parkingDetails: ParkingType) => Promise<void>
}
export const ParkedCall = ({ parkingDetails, onPickup }: ParkingCallProps) => {
  const [time, setTime] = useState<number>(
    parkingDetails.parkedCaller?.timeout ?? parkingDetails.timeout ?? 0,
  )
  const [cardPressStates, setCardPressStates] = useState<boolean>(false)
  const [status, setStatus] = useState('begin')

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= Math.ceil(parkingDetails.timeout / 2)) {
          setStatus('middle')
        }
        if (prevTime <= Math.ceil(parkingDetails.timeout / 4)) {
          setStatus('end')
        }
        if (prevTime <= 0) {
          clearInterval(interval)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [parkingDetails.timeout])

  const formattedTime = new Date(time * 1000).toISOString().slice(14, 19)
  const animationControls: any = useRef(null)
  const hintTooltipId = useId()

  // press and hold, with the pointer or with Space and Enter, to pick up
  const startPress = () => {
    if (!cardPressStates) {
      setCardPressStates(true)
      animationControls.current = setTimeout(() => {
        longPressHandler(parkingDetails)
      }, 2000)
    }
  }

  const stopPress = () => {
    setCardPressStates(false)
    if (animationControls.current) {
      clearTimeout(animationControls.current)
    }
    resetAnimation()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (!event.repeat) startPress()
    }
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      stopPress()
    }
  }

  const longPressHandler = (parkingDetails: ParkingType) => {
    onPickup(parkingDetails)
    resetAnimation()
  }

  const resetAnimation = () => {
    animationControls.current = null
  }

  return (
    <div className='flex flex-row items-start justify-between gap-4 py-3'>
      <>
        <div className='flex min-w-0 flex-1 flex-col justify-start gap-1'>
          <div className='flex min-w-0 flex-row items-center gap-2 text-sm font-medium text-titleLight dark:text-titleDark'>
            <FontAwesomeIcon
              icon={ParkedCallIcon}
              className='size-4 shrink-0'
              aria-hidden='true'
            />
            <span
              className='truncate text-left text-sm'
              data-tooltip-id={`tooltip-parked-title-${parkingDetails.name}`}
              data-tooltip-content={`${t('Parks.Parking')} ${parkingDetails.name}`}
            >
              {t('Parks.Parking')} {parkingDetails.name}
              <CustomThemedTooltip
                id={`tooltip-parked-title-${parkingDetails.name}`}
                place='bottom'
              />
            </span>
          </div>
          <span
            data-tooltip-id={`tooltip-parked-user-${parkingDetails.name}`}
            data-tooltip-content={parkingDetails?.parkedCaller?.name}
            className='truncate text-left text-sm font-medium text-titleLight dark:text-titleDark'
          >
            {parkingDetails?.parkedCaller?.name}
            <CustomThemedTooltip
              id={`tooltip-parked-user-${parkingDetails.name}`}
              place='bottom'
            />
          </span>
          <span className='truncate text-sm leading-5 text-gray-600 dark:text-gray-400'>
            {parkingDetails?.parkedCaller?.num || t('Common.Unknown')}
          </span>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-2'>
          <span
            className={classNames(
              status === 'begin'
                ? 'text-titleLight dark:text-titleDark'
                : status === 'middle'
                  ? 'text-amber-700 dark:text-amber-500'
                  : 'text-red-700 dark:text-red-500',
              'flex shrink-0 items-center gap-1 text-sm tabular-nums',
            )}
          >
            {status !== 'begin' && (
              <>
                <FontAwesomeIcon
                  icon={UrgencyIcon}
                  className='size-3'
                  aria-hidden='true'
                />
                <span className='sr-only'>
                  {t(
                    status === 'middle'
                      ? 'Parks.Parking timeout soon'
                      : 'Parks.Parking timeout very soon',
                  )}
                </span>
              </>
            )}
            {formattedTime}
          </span>
          <div className='relative'>
            <Button
              variant='white'
              className='relative min-w-28 gap-2 overflow-hidden'
              aria-label={
                t('Parks.Pick up call in parking', {
                  name: parkingDetails.name,
                }) ?? undefined
              }
              data-tooltip-id={hintTooltipId}
              data-tooltip-content={
                t('Parks.Press and hold to pick up') ?? undefined
              }
              onPointerDown={startPress}
              onPointerUp={stopPress}
              onPointerLeave={stopPress}
              onPointerCancel={stopPress}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onBlur={stopPress}
            >
              {/* the press and hold fill: over the button background, under its content */}
              <motion.div
                aria-hidden='true'
                initial={{ width: 0 }}
                animate={
                  cardPressStates
                    ? { width: '100%', transition: { duration: 2 } }
                    : { width: 0 }
                }
                className='pointer-events-none absolute inset-y-0 left-0 bg-emerald-500'
              />
              <FontAwesomeIcon
                icon={CallIcon}
                aria-hidden='true'
                className={classNames(
                  'relative size-4',
                  cardPressStates
                    ? 'text-gray-600 dark:text-gray-200'
                    : 'text-textBlueLight dark:text-textBlueDark',
                )}
              />
              <span
                className={classNames(
                  'relative overflow-hidden whitespace-nowrap',
                  cardPressStates
                    ? 'text-gray-600 dark:text-gray-200'
                    : 'text-textBlueLight dark:text-textBlueDark',
                )}
              >
                {t('Parks.Pick up')}
              </span>
            </Button>
            <CustomThemedTooltip id={hintTooltipId} place='bottom' />
          </div>
        </div>
      </>
    </div>
  )
}
