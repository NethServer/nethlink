import { createRef, useState } from 'react'
import {
  faCommentDots as EmptyIcon,
  faCommentMedical as NewChatIcon,
  faRightFromBracket as LeaveIcon,
  faTrash as DeleteIcon,
  faTriangleExclamation as WarningIcon,
  faUsers as GroupIcon,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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

// Like the last calls: "15h ago (30 Sep 2026 18:08)".
const when = (ts: number) => {
  const language = i18next.languages?.[0] || 'en'
  return `${formatDistanceToNowStrict(ts, { addSuffix: true, locale: shortLocale(language) })} (${format(ts, 'd MMM yyyy HH:mm', { locale: language === 'it' ? it : enGB })})`
}

// Leaving a group I do not own; deleting a chat, or a group I own for everyone.
const leaves = (c: ChatConversation) => c.kind === 'group' && !c.owner

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
      className='font-Poppins w-[100px]'
    >
      <Modal.Content>
        <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-bgAmberLight dark:bg-bgAmberDark'>
          <FontAwesomeIcon
            icon={WarningIcon}
            className='h-6 w-6 text-iconAmberLight dark:text-iconAmberDark'
            aria-hidden='true'
          />
        </div>
        <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
          <h3 className='font-medium text-[18px] leading-7 text-titleLight dark:text-titleDark'>
            {leaves(conversation) ? t('Chat.Leave') : t('Chat.Delete')}
          </h3>
          <p className='mt-3 font-normal text-[14px] leading-5 text-gray-700 dark:text-gray-200'>
            {conversation.kind === 'group'
              ? conversation.owner
                ? t('Chat.Delete group confirm', { name })
                : t('Chat.Leave confirm', { name })
              : t('Chat.Delete confirm', { name })}
          </p>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button
          variant='danger'
          className='font-medium text-[14px] leading-5'
          onClick={confirm}
        >
          {leaves(conversation) ? t('Chat.Leave') : t('Common.Delete')}
        </Button>
        <Button
          variant='ghost'
          className='font-medium text-[14px] leading-5 gap-3'
          onClick={close}
          ref={cancelRef}
        >
          <p className='dark:text-textBlueDark text-textBlueLight'>
            {t('Common.Cancel')}
          </p>
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
      <Scrollable>
        {conversations?.length ? (
          conversations.map((c, idx) => (
            <div
              key={c.peer}
              onClick={() => openChat(c.peer)}
              className='group cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight hover:shadow-[0px_-1px_0px_0px_#E5E7EB] dark:hover:shadow-[0px_-1px_0px_0px_#374151]'
            >
              <div className='px-5'>
                <div
                  className={
                    idx === conversations.length - 1
                      ? ''
                      : 'border-b dark:border-borderDark border-borderLight'
                  }
                >
                  {/* Same layout as the last calls */}
                  <div className='flex gap-3 min-h-[72px] py-6 px-3'>
                    <div className='flex flex-col min-w-6 pt-[6px]'>
                      {c.kind === 'group' && !c.avatar ? (
                        <span className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-white'>
                          <FontAwesomeIcon
                            icon={GroupIcon}
                            className='text-xs'
                          />
                        </span>
                      ) : (
                        <Avatar
                          size='small'
                          src={c.avatar}
                          placeholderType='person'
                          status={
                            c.kind === 'chat' && c.online ? 'online' : undefined
                          }
                        />
                      )}
                    </div>
                    <div className='flex flex-col gap-1 min-w-0 flex-1 dark:text-titleDark text-titleLight'>
                      <p className='font-medium text-[14px] leading-5 truncate'>
                        {c.name}
                        {c.inactive && (
                          <span className='ml-2 font-normal text-xs text-gray-500 dark:text-gray-400'>
                            {t('Chat.No longer active')}
                          </span>
                        )}
                      </p>
                      <p className='text-[14px] leading-5 truncate text-gray-600 dark:text-gray-400'>
                        {c.last &&
                          (c.last.mine
                            ? `${t('Chat.You')}: `
                            : c.kind === 'group' && c.last.nick
                              ? `${nameOf(c.last.nick)}: `
                              : '')}
                        {c.last?.body}
                      </p>
                      {c.last && (
                        <p className='truncate text-gray-600 dark:text-gray-100 font-normal text-[14px] leading-5'>
                          {when(c.last.ts)}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center gap-2 self-center shrink-0'>
                      {c.unread > 0 && (
                        <span className='min-w-5 h-5 px-1.5 rounded-full text-xs leading-5 text-center text-white bg-textBlueLight dark:bg-textBlueDark'>
                          {c.unread}
                        </span>
                      )}
                      <button
                        title={
                          (leaves(c) ? t('Chat.Leave') : t('Chat.Delete')) || ''
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          setToDelete(c)
                        }}
                        className='invisible group-hover:visible p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-textRedLight dark:hover:text-textRedDark'
                      >
                        <FontAwesomeIcon
                          icon={leaves(c) ? LeaveIcon : DeleteIcon}
                          className='text-sm'
                        />
                      </button>
                    </div>
                  </div>
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
