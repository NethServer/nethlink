import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faUsers as QueuesIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { Button } from '@renderer/components/Nethesis'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'
import { QueueItem, QueueItemSkeleton } from './QueueItem'
import { QueuesAllMenu } from './QueuesAllMenu'
import { QueueAction, useQueuesModule } from './hook/useQueuesModule'

// the title of the error of an action, on one queue or on all of them
const ERROR_TITLES: Record<QueueAction, { one: string; all: string }> = {
  logIn: {
    one: 'Queues.Cannot log in to queue',
    all: 'Queues.Cannot log in to all queues',
  },
  logOut: {
    one: 'Queues.Cannot log out of queue',
    all: 'Queues.Cannot log out of all queues',
  },
  pause: {
    one: 'Queues.Cannot pause queue',
    all: 'Queues.Cannot pause all queues',
  },
  endPause: {
    one: 'Queues.Cannot end pause on queue',
    all: 'Queues.Cannot end pause on all queues',
  },
}

export const QueuesBox = () => {
  const {
    myQueues,
    getMyMember,
    getMyPauseReason,
    dynamicQueues,
    isLoggedInToAny,
    pausableQueues,
    pausedQueues,
    pendingActions,
    allPendingAction,
    error,
    toggleLogin,
    pauseQueue,
    endPauseQueue,
    toggleLoginAll,
    pauseAll,
    endPauseAll,
  } = useQueuesModule()

  const errorTitle = error
    ? t(ERROR_TITLES[error.action][error.queue ? 'one' : 'all'])
    : ''
  const hasAllActions =
    dynamicQueues.length > 0 ||
    pausableQueues.length > 0 ||
    pausedQueues.length > 0

  return (
    <>
      <ModuleTitle
        title={t('Queues.Queues')}
        actionComponent={
          hasAllActions && (
            <QueuesAllMenu
              login={
                dynamicQueues.length === 0
                  ? undefined
                  : isLoggedInToAny
                    ? 'logOut'
                    : 'logIn'
              }
              // as in NethVoice CTI: end the pause first when any queue is paused
              pause={
                pausedQueues.length > 0
                  ? 'endPause'
                  : pausableQueues.length > 0
                    ? 'pause'
                    : undefined
              }
              isPending={!!allPendingAction}
              onToggleLogin={toggleLoginAll}
              onPause={pauseAll}
              onEndPause={endPauseAll}
            />
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
                      myPauseReason={getMyPauseReason(queue)}
                      pendingAction={pendingActions[queue.queue]}
                      onToggleLogin={toggleLogin}
                      onPause={pauseQueue}
                      onEndPause={endPauseQueue}
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
