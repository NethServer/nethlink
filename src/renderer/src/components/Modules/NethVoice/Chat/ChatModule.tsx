import {
  faComments as EmptyIcon,
  faPenToSquare as NewChatIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { useNethlinkData } from '@renderer/store'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'
import { Avatar } from '@renderer/components/Nethesis'
import { openChat } from '@renderer/hooks/useChatBridge'

const time = (ts: number) => {
  const d = new Date(ts)
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString()
}

export function ChatModule() {
  const [conversations] = useNethlinkData('chatConversations')

  return (
    <>
      <ModuleTitle
        title={t('Chat.Chat')}
        action={() => openChat()}
        actionIcon={NewChatIcon}
        actionText={t('Chat.New chat')}
      />
      <Scrollable>
        {conversations?.length ? (
          conversations.map((c) => (
            <div
              key={c.peer}
              onClick={() => openChat(c.peer)}
              className='flex items-center gap-3 px-5 py-2 cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight'
            >
              <Avatar
                size='base'
                src={c.avatar}
                placeholderType={c.kind === 'group' ? 'company' : 'person'}
                status={c.kind === 'chat' && c.online ? 'online' : undefined}
              />
              <div className='flex-1 min-w-0'>
                <div className='flex justify-between gap-2'>
                  <span className='truncate font-medium dark:text-titleDark text-titleLight'>
                    {c.name}
                  </span>
                  {c.last && (
                    <span className='shrink-0 text-xs text-gray-600 dark:text-gray-400'>
                      {time(c.last.ts)}
                    </span>
                  )}
                </div>
                <div className='flex justify-between gap-2'>
                  <span className='truncate text-gray-600 dark:text-gray-400'>
                    {c.last &&
                      (c.last.mine
                        ? `${t('Chat.You')}: `
                        : c.kind === 'group' && c.last.nick
                          ? `${c.last.nick}: `
                          : '')}
                    {c.last?.body}
                  </span>
                  {c.unread > 0 && (
                    <span className='shrink-0 min-w-5 h-5 px-1.5 rounded-full text-xs leading-5 text-center text-white bg-textBlueLight dark:bg-textBlueDark'>
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyList icon={EmptyIcon} text={t('Chat.No conversations')} />
        )}
      </Scrollable>
    </>
  )
}
