import { useEffect } from 'react'
import { useNethlinkData } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'

/** Opens a conversation, or the new chat panel, in the chat window. */
export const openChat = (username?: string) =>
  window.electron.send(
    IPC_EVENTS.CHAT_TO_ISLAND,
    username ? 'chat-island-open' : 'chat-island-new',
    username ? { username } : undefined,
  )

/** Island state for NethLink, and the colleagues for the island. */
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
    return () => window.electron.removeAllListeners(IPC_EVENTS.CHAT_FROM_ISLAND)
  }, [])

  // Names, avatars, presence and number; sent again once the island is up.
  useEffect(() => {
    const ops: any = operators?.operators || {}
    const avatars: any = operators?.avatars || {}
    const contacts = Object.values(ops)
      .filter((op: any) => op?.username && op.username !== username)
      .map((op: any) => ({
        username: op.username,
        name: op.name || op.username,
        avatar: avatars[op.username],
        presence: op.mainPresence,
        number: op.endpoints?.mainextension?.[0]?.id,
      }))
    if (contacts.length && up) {
      window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-contacts', {
        contacts,
      })
    }
  }, [operators, username, up])
}
