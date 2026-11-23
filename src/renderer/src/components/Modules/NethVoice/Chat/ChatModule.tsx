import { createRef, useState } from 'react'
import {
  faMessage as EmptyIcon,
  faArrowRightFromBracket as LeaveIcon,
  faTrash as DeleteIcon,
  faTriangleExclamation as WarningIcon,
  faLock as LockIcon,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faNewChat as NewChatIcon } from './icons'
import i18next, { t } from 'i18next'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { enGB, it } from 'date-fns/locale'
import { shortLocale } from '@renderer/lib/dateTime'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { ChatConversation } from '@shared/types'
import { Modal } from '@renderer/components'
import { parseThemeToClassName, truncate } from '@renderer/utils'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { Avatar, Button } from '@renderer/components/Nethesis'
import { openChat } from '@renderer/hooks/useChatBridge'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

// A conversation name: the themed tooltip only when it does not fit, like the last calls.
function Name({
  peer,
  name,
  children,
}: {
  peer: string
  name: string
  children?: React.ReactNode
}) {
  const [ref, truncated] = useIsTruncated<HTMLParagraphElement>([name])
  const id = `tooltip-chat-name-${peer}`
  return (
    <>
      {/* Only the name truncates: badges after it stay whole. */}
      <div className='flex items-center min-w-0'>
        <p
          ref={ref}
          className='truncate text-sm font-medium leading-5'
          data-tooltip-id={truncated ? id : undefined}
          data-tooltip-content={truncated ? name : undefined}
        >
          {name}
        </p>
        {children}
      </div>
      {truncated && (
        <CustomThemedTooltip id={id} place='bottom' className='z-10' />
      )}
    </>
  )
}

// Like the last calls: "15h ago (30 Sep 2026 18:08)".
const when = (ts: number) => {
  const language = i18next.languages?.[0] || 'en'
  return `${formatDistanceToNowStrict(ts, { addSuffix: true, locale: shortLocale(language) })} (${format(ts, 'd MMM yyyy HH:mm', { locale: language === 'it' ? it : enGB })})`
}

// Leaving a group I do not own; deleting a chat, or a group I own for everyone.
const leaves = (c: ChatConversation) => c.kind === 'group' && !c.owner
// Two letters, as the chat heads: a one-word name's first two, else the first two words' initials.
const groupInitials = (name: string) => {
  const words = name
    .replace(/^Queue - /, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
  return (
    words.length === 1
      ? words[0].slice(0, 2)
      : words
          .slice(0, 2)
          .map((w) => w[0])
          .join('') || 'G'
  ).toUpperCase()
}

function DeleteDialog({
  conversation,
  close,
}: {
  conversation: ChatConversation
  close: () => void
}) {
  const [theme] = useSharedState('theme')
  const cancelRef = createRef<HTMLButtonElement>()
  const name = truncate(conversation.name, 30)
  const confirm = () => {
    window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-delete', {
      username: conversation.peer,
    })
    close()
  }
  return (
    <Modal
      show={true}
      focus={cancelRef}
      onClose={close}
      themeMode={parseThemeToClassName(theme)}
      className='font-Poppins'
    >
      <Modal.Content>
        <div className='mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 bg-bgAmberLight dark:bg-bgAmberDark'>
          <FontAwesomeIcon
            icon={WarningIcon}
            className='size-6 text-iconAmberLight dark:text-iconAmberDark'
            aria-hidden='true'
          />
        </div>
        <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
          <h3 className='text-lg font-medium leading-7 text-titleLight dark:text-titleDark'>
            {leaves(conversation) ? t('Chat.Leave') : t('Chat.Delete')}
          </h3>
          <p className='mt-3 text-sm font-normal leading-5 text-gray-700 dark:text-gray-200'>
            {conversation.kind === 'group'
              ? conversation.owner
                ? t('Chat.Delete group confirm', { name })
                : t('Chat.Leave confirm', { name })
              : t('Chat.Delete confirm', { name })}
          </p>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button variant='danger' onClick={confirm}>
          {leaves(conversation) ? t('Chat.Leave') : t('Common.Delete')}
        </Button>
        <Button variant='ghost' onClick={close} ref={cancelRef}>
          {t('Common.Cancel')}
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export function ChatModule() {
  const [conversations] = useNethlinkData('chatConversations')
  const [operators] = useNethlinkData('operators')
  const [toDelete, setToDelete] = useState<ChatConversation>()
  const nameOf = (u: string) => operators?.operators?.[u]?.name || u

  return (
    <>
      <ModuleTitle
        title={t('Chat.Messages')}
        action={() => openChat()}
        actionIcon={NewChatIcon}
        actionText={t('Chat.New chat')}
      />
      <CustomThemedTooltip id='tooltip-chat-action' place='left' />
      <Scrollable>
        {conversations?.length ? (
          conversations.map((c, idx) => (
            <div key={c.peer} className='group px-4'>
              <div
                className={
                  idx === conversations.length - 1
                    ? 'flex items-center gap-3'
                    : 'flex items-center gap-3 border-b border-borderLight dark:border-borderDark'
                }
              >
                {/* Same layout as the last calls */}
                <button
                  type='button'
                  onClick={() => openChat(c.peer)}
                  className='flex min-h-14 min-w-0 flex-1 items-start gap-3 rounded-md py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
                >
                  <div className='flex shrink-0 flex-col pt-0.5'>
                    {c.kind === 'group' && !c.avatar ? (
                      // As in the CTI and the chat window: the group's initials; operator groups (cti-…) blue, a queue's chat indigo, the others as a person's.
                      <span
                        aria-hidden='true'
                        className={`flex size-8 items-center justify-center rounded-full text-sm font-normal dark:font-medium ${c.peer.startsWith('cti-') ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : c.name.startsWith('Queue - ') ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' : 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-950'}`}
                      >
                        {groupInitials(c.name)}
                      </span>
                    ) : (
                      <Avatar
                        size='small'
                        src={c.avatar}
                        placeholderType='operator'
                        status={
                          c.kind === 'chat' && c.online ? 'online' : undefined
                        }
                      />
                    )}
                  </div>
                  <div className='flex min-w-0 flex-1 flex-col gap-1 text-titleLight dark:text-titleDark'>
                    <Name peer={c.peer} name={c.name}>
                      {c.inactive && (
                        <span className='ml-2 shrink-0 text-xs font-normal text-gray-600 dark:text-gray-400'>
                          {t('Chat.No longer active')}
                        </span>
                      )}
                      {c.guests && (
                        // As in the chat window: indigo, open to people outside, a lock once its link is closed.
                        <span className='ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium leading-4 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100'>
                          {c.locked && (
                            <FontAwesomeIcon
                              icon={LockIcon}
                              className='size-3'
                              aria-hidden='true'
                            />
                          )}
                          {t('Chat.External chat')}
                        </span>
                      )}
                    </Name>
                    {/* As in the CTI: a group's size under its name, "No messages yet" until the first one. */}
                    {c.kind === 'group' && c.members && (
                      <p
                        className='truncate text-sm leading-5 text-gray-600 dark:text-gray-400'
                        title={c.members.map(nameOf).join(', ')}
                      >
                        {t('Chat.Members count', { count: c.members.length })}
                      </p>
                    )}
                    <p className='truncate text-sm leading-5 text-gray-600 dark:text-gray-400'>
                      {c.last ? (
                        c.last.mine ? (
                          t('Chat.Last message by you', { body: c.last.body })
                        ) : c.kind === 'group' && c.last.nick ? (
                          t('Chat.Last message by', {
                            name: nameOf(c.last.nick),
                            body: c.last.body,
                          })
                        ) : (
                          c.last.body
                        )
                      ) : (
                        <span className='italic'>
                          {t('Chat.No messages yet')}
                        </span>
                      )}
                    </p>
                    {c.last && (
                      <p className='truncate text-sm font-normal leading-5 text-gray-600 dark:text-gray-400'>
                        {when(c.last.ts)}
                      </p>
                    )}
                  </div>
                </button>
                <div className='flex shrink-0 items-center gap-2'>
                  {c.unread > 0 && (
                    <span className='h-5 min-w-5 rounded-full bg-textBlueLight px-1.5 text-center text-xs leading-5 text-white dark:bg-blue-700 dark:text-white'>
                      {c.unread}
                    </span>
                  )}
                  {/* The CTI groups' rooms follow the CTI: nobody leaves or deletes them here, as in the CTI. */}
                  {!c.peer.startsWith('cti-') && (
                    <button
                      type='button'
                      aria-label={
                        (leaves(c) ? t('Chat.Leave') : t('Chat.Delete')) ||
                        undefined
                      }
                      data-tooltip-id='tooltip-chat-action'
                      data-tooltip-content={
                        (leaves(c) ? t('Chat.Leave') : t('Chat.Delete')) || ''
                      }
                      onClick={() => setToDelete(c)}
                      className='rounded-lg p-2 text-gray-600 hover:text-textRedLight focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:text-gray-400 dark:hover:text-textRedDark dark:focus-visible:ring-primaryRingDark'
                    >
                      <FontAwesomeIcon
                        icon={leaves(c) ? LeaveIcon : DeleteIcon}
                        className='size-4'
                        aria-hidden='true'
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList icon={EmptyIcon} text={t('Chat.No conversations')} />
        )}
      </Scrollable>
      {toDelete && (
        <DeleteDialog
          conversation={toDelete}
          close={() => setToDelete(undefined)}
        />
      )}
    </>
  )
}
