import { useEffect } from 'react'
import { useNethlinkData } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { contactsFromOperators } from '@nethesis/chat-island'

/** Opens a conversation, or the new chat panel, in the chat window. */
export const openChat = (username?: string) =>
  window.electron.send(
    IPC_EVENTS.CHAT_TO_ISLAND,
    username ? 'chat-island-open' : 'chat-island-new',
    username ? { username } : undefined,
  )

/** Island state for NethLink, and the operators for the island. */
export function useChatBridge(username?: string) {
  const [chatStatus, setChatStatus] = useNethlinkData('chatStatus')
  const [, setChatUnread] = useNethlinkData('chatUnread')
  const [, setChatConversations] = useNethlinkData('chatConversations')
  const [operators] = useNethlinkData('operators')
  const up = !!chatStatus

  useEffect(() => {
    window.electron.receive(IPC_EVENTS.CHAT_FROM_ISLAND, (name, detail) => {
      if (name === 'chat-island-status') setChatStatus(detail?.status)
      if (name === 'chat-island-unread') setChatUnread(detail?.total ?? 0)
      if (name === 'chat-island-conversations')
        setChatConversations(detail?.conversations ?? [])
    })
    // The chat window may be up already: ask for its state.
    window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-sync')
    return () => window.electron.removeAllListeners(IPC_EVENTS.CHAT_FROM_ISLAND)
  }, [])

  // Names, avatars, presence and number; sent again once the island is up.
  useEffect(() => {
    const contacts = contactsFromOperators(
      operators?.operators as any,
      operators?.avatars as any,
      username || '',
    )
    if (contacts.length && up) {
      window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-contacts', {
        contacts,
      })
    }
  }, [operators, username, up])
}
