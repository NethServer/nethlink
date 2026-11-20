import { useEffect, useId, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faChevronDown,
  faChevronUp,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { Avatar, Button } from '@renderer/components/Nethesis'
import { useNethlinkData } from '@renderer/store'
import { QueueMemberType, QueueType } from '@shared/types'
import { QueueStatusBadge } from './QueueStatusBadge'
import { getMemberStatus, isDynamicMember } from './hook/useQueuesModule'

// mm:ss, or h:mm:ss from one hour on
export const formatWait = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// the current time, updated every second while enabled
const useNow = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [enabled])
  return now
}

const sortMembers = (a: QueueMemberType, b: QueueMemberType) => {
  const rank = { signedIn: 0, paused: 1, signedOut: 2 }
  return (
    rank[getMemberStatus(a)] - rank[getMemberStatus(b)] ||
    (a.name || '').localeCompare(b.name || '')
  )
}

export interface QueueItemProps {
  queue: QueueType
  myMember?: QueueMemberType
  isPending: boolean
  onToggle: (queue: QueueType) => void
}

export const QueueItem = ({
  queue,
  myMember,
  isPending,
  onToggle,
}: QueueItemProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  // for the avatar and the presence of the operators of the queue
  const [operators] = useNethlinkData('operators')
  const detailsId = useId()

  const waitingCallers = Object.values(queue.waitingCallers || {}).sort(
    (a, b) => Number(a.position) - Number(b.position),
  )
  const members = Object.values(queue.members || {}).sort(sortMembers)
  // the operators that take calls or are on a break, the signed out ones are left out
  const signedInMembers = members.filter((m) => m.loggedIn)
  const activeOperators = members.filter(
    (m) => getMemberStatus(m) === 'signedIn',
  ).length
  const now = useNow(isExpanded && waitingCallers.length > 0)
  // the first caller in line is the one who waits the longest
  const maxWait = waitingCallers.length
    ? (now - waitingCallers[0].waitingTime) / 1000
    : 0

  const isSignedIn = !!myMember?.loggedIn
  const canToggle = isDynamicMember(myMember)

  return (
    <div>
      <div className='flex items-center gap-3 py-3'>
        <button
          type='button'
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          onClick={() => setIsExpanded((p) => !p)}
          className='flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
        >
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            className='size-4 shrink-0 text-gray-600 dark:text-gray-400'
            aria-hidden='true'
          />
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='truncate text-sm font-medium leading-5 text-gray-900 dark:text-gray-50'>
              {queue.name}{' '}
              <span className='font-normal text-gray-600 dark:text-gray-400'>
                {queue.queue}
              </span>
            </span>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <QueueStatusBadge status={getMemberStatus(myMember)} />
              {waitingCallers.length > 0 && (
                <span className='whitespace-nowrap text-xs leading-4 text-gray-600 dark:text-gray-400'>
                  {t('Queues.waiting_calls_count', {
                    count: waitingCallers.length,
                  })}
                </span>
              )}
            </div>
          </div>
        </button>
        {canToggle && (
          <Button
            variant='white'
            size='small'
            className='shrink-0 gap-2'
            disabled={isPending}
            aria-label={
              t(
                isSignedIn
                  ? 'Queues.Sign out of queue'
                  : 'Queues.Sign in to queue',
                { name: queue.name },
              ) ?? undefined
            }
            onClick={() => onToggle(queue)}
          >
            <FontAwesomeIcon
              icon={
                isPending
                  ? faCircleNotch
                  : isSignedIn
                    ? faArrowRightFromBracket
                    : faArrowRightToBracket
              }
              spin={isPending}
              className='size-4'
              aria-hidden='true'
            />
            {t(isSignedIn ? 'Queues.Sign out' : 'Queues.Sign in')}
          </Button>
        )}
      </div>

      {isExpanded && (
        <div
          id={detailsId}
          className='flex flex-col gap-5 pb-4 pl-7 text-sm leading-5'
        >
          <dl className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col gap-0.5'>
              <dt className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
                {t('Queues.Waiting calls')}
              </dt>
              <dd className='font-medium text-gray-900 dark:text-gray-50'>
                {waitingCallers.length}
              </dd>
            </div>
            <div className='flex flex-col gap-0.5'>
              <dt className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
                {t('Queues.Operators')}
              </dt>
              <dd className='font-medium text-gray-900 dark:text-gray-50'>
                {t('Queues.active_of_total', {
                  active: activeOperators,
                  total: members.length,
                })}
              </dd>
            </div>
            <div className='flex flex-col gap-0.5'>
              <dt className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
                {t('Queues.Max wait')}
              </dt>
              <dd className='font-medium tabular-nums text-gray-900 dark:text-gray-50'>
                {formatWait(maxWait)}
              </dd>
            </div>
          </dl>

          {!canToggle && myMember && (
            <p className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
              {t('Queues.Static member description')}
            </p>
          )}

          {waitingCallers.length > 0 && (
            <section className='flex flex-col gap-2'>
              <h3 className='text-xs font-medium leading-4 text-gray-700 dark:text-gray-200'>
                {t('Queues.Waiting calls')}
              </h3>
              <ul className='flex flex-col'>
                {waitingCallers.map((caller, idx) => (
                  <li
                    key={`${caller.num}-${idx}`}
                    className='flex items-center justify-between gap-3 py-1'
                  >
                    <span className='min-w-0 truncate text-gray-900 dark:text-gray-50'>
                      {caller.name && caller.name !== caller.num
                        ? caller.name
                        : caller.num || t('Common.Unknown')}
                      {caller.name && caller.name !== caller.num && (
                        <span className='text-gray-600 dark:text-gray-400'>
                          {' '}
                          {caller.num}
                        </span>
                      )}
                    </span>
                    <span className='shrink-0 tabular-nums text-gray-600 dark:text-gray-400'>
                      {formatWait((now - caller.waitingTime) / 1000)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className='flex flex-col gap-2'>
            <h3 className='text-xs font-medium leading-4 text-gray-700 dark:text-gray-200'>
              {t('Queues.Signed-in operators')}
            </h3>
            {signedInMembers.length === 0 && (
              <p className='text-gray-600 dark:text-gray-400'>
                {t('Queues.No signed-in operators')}
              </p>
            )}
            <ul className='flex flex-col'>
              {signedInMembers.map((member) => {
                const username =
                  operators?.extensions?.[member.member]?.username
                return (
                  <li
                    key={member.member}
                    className='flex min-h-12 items-center gap-3 py-2'
                  >
                    <Avatar
                      size='small'
                      src={
                        (username && operators?.avatars?.[username]) ||
                        undefined
                      }
                      status={
                        username
                          ? operators?.operators?.[username]?.mainPresence
                          : undefined
                      }
                      placeholderType='operator'
                    />
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <span className='truncate font-medium text-titleLight dark:text-titleDark'>
                        {member.name || member.member}
                      </span>
                      <span className='truncate text-gray-600 dark:text-gray-400'>
                        {member.member}
                      </span>
                    </div>
                    {/* all of them are signed in: only a break is worth a badge */}
                    {getMemberStatus(member) === 'paused' && (
                      <QueueStatusBadge status='paused' />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

export const QueueItemSkeleton = () => (
  <div className='flex items-center gap-3 py-3'>
    <div className='size-4 shrink-0 animate-pulse rounded bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
    <div className='flex flex-1 flex-col gap-2'>
      <div className='h-4 w-40 animate-pulse rounded bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
      <div className='h-4 w-24 animate-pulse rounded bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
    </div>
    <div className='h-7 w-20 animate-pulse rounded bg-surfaceSkeleton dark:bg-surfaceSkeletonDark' />
  </div>
)
