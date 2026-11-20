import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faArrowUpRightFromSquare,
  faCircleNotch,
  faUsers as QueuesIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { Button } from '@renderer/components/Nethesis'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'
import { QueueItem, QueueItemSkeleton } from './QueueItem'
import { useQueuesModule } from './hook/useQueuesModule'

export const QueuesBox = () => {
  const {
    myQueues,
    getMyMember,
    dynamicQueues,
    isSignedInToAny,
    pendingQueues,
    isAllPending,
    error,
    toggleQueue,
    toggleAllQueues,
  } = useQueuesModule()

  const errorTitle = error
    ? error.queue
      ? t(
          error.action === 'signIn'
            ? 'Queues.Cannot sign in to queue'
            : 'Queues.Cannot sign out of queue',
        )
      : t(
          error.action === 'signIn'
            ? 'Queues.Cannot sign in to all queues'
            : 'Queues.Cannot sign out of all queues',
        )
    : ''

  return (
    <>
      <ModuleTitle
        title={t('Queues.Queues')}
        actionComponent={
          dynamicQueues.length > 0 && (
            <Button
              variant='ghost'
              size='small'
              className='-mr-2 gap-2'
              disabled={isAllPending}
              onClick={toggleAllQueues}
            >
              <FontAwesomeIcon
                icon={
                  isAllPending
                    ? faCircleNotch
                    : isSignedInToAny
                      ? faArrowRightFromBracket
                      : faArrowRightToBracket
                }
                spin={isAllPending}
                className='size-4'
                aria-hidden='true'
              />
              {t(
                isSignedInToAny
                  ? 'Queues.Sign out of all queues'
                  : 'Queues.Sign in to all queues',
              )}
            </Button>
          )
        }
      />
      <Scrollable>
        {error && (
          <div className='px-4 pt-3'>
            <InlineNotification type='error' title={errorTitle}>
              {error.queue
                ? t('Queues.Queue not changed description', {
                    name: error.queue.name,
                  })
                : t('Queues.Some queues not changed description')}
            </InlineNotification>
          </div>
        )}
        {myQueues ? (
          myQueues.length > 0 ? (
            <>
              <ul className='px-4'>
                {myQueues.map((queue) => (
                  <li
                    key={queue.queue}
                    className='border-b border-borderLight last:border-b-0 dark:border-borderDark'
                  >
                    <QueueItem
                      queue={queue}
                      myMember={getMyMember(queue)}
                      isPending={pendingQueues.includes(queue.queue)}
                      onToggle={toggleQueue}
                    />
                  </li>
                ))}
              </ul>
              <div className='mx-4 flex flex-col items-start gap-2 border-t border-borderLight py-4 dark:border-borderDark'>
                <p className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
                  {t('Queues.Queues in CTI description')}
                </p>
                <Button
                  variant='ghost'
                  size='small'
                  className='-ml-2.5 gap-2'
                  onClick={() => window.api.openHostPage('/queues')}
                >
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className='size-4'
                    aria-hidden='true'
                  />
                  {t('Queues.Open NethVoice CTI')}
                </Button>
              </div>
            </>
          ) : (
            <EmptyList
              icon={QueuesIcon}
              text={t('Queues.No queues')}
              subtitle={t('Queues.No queues description') ?? undefined}
            />
          )
        ) : (
          <div className='mx-4 divide-y divide-borderLight dark:divide-borderDark'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <QueueItemSkeleton key={idx} />
            ))}
          </div>
        )}
      </Scrollable>
    </>
  )
}
