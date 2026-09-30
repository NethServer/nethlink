import { ChatIsland } from '@nethesis/chat-island'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { useEffect, useMemo, useRef, useState } from 'react'

// Room around the island for its shadows.
const PAD = 24
// Island events NethLink listens to.
const OUT = [
  'chat-island-status',
  'chat-island-unread',
  'chat-island-conversations',
]

export function ChatIslandPage() {
  const [account] = useSharedState('account')
  const [theme] = useSharedState('theme')
  const [enabled, setEnabled] = useState(false)

  const allowed =
    !!account?.data?.profile?.macro_permissions?.nethvoice_cti?.permissions
      ?.chat?.value

  // The chat is on for this NethVoice when its gateway answers.
  useEffect(() => {
    setEnabled(false)
    if (!account?.host || !allowed) return
    fetch(`https://${account.host}/chat-gw/healthz`)
      .then((r) => setEnabled(r.ok))
      .catch(() => setEnabled(false))
  }, [account?.host, allowed])

  const dataConfig = useMemo(
    () =>
      account?.jwtToken
        ? btoa(`${account.host}:${account.username}:${account.jwtToken}`)
        : '',
    [account?.host, account?.username, account?.jwtToken],
  )
  const on = enabled && !!dataConfig

  // The window follows the island's size.
  useEffect(() => {
    if (!on) {
      window.electron.send(IPC_EVENTS.CHAT_ISLAND_RESIZE, { w: 0, h: 0 })
      return
    }
    let observer: ResizeObserver | undefined
    const timer = setInterval(() => {
      const root = document.querySelector('.chat-island-root')
      if (!root || observer) return
      observer = new ResizeObserver(() => {
        const { width, height } = root.getBoundingClientRect()
        window.electron.send(
          IPC_EVENTS.CHAT_ISLAND_RESIZE,
          width < 8
            ? { w: 0, h: 0 }
            : { w: width + 16 + PAD, h: height + 20 + PAD },
        )
      })
      observer.observe(root)
    }, 200)
    return () => {
      clearInterval(timer)
      observer?.disconnect()
    }
  }, [on])

  // Events between the island and NethLink.
  useEffect(() => {
    if (!on) return
    window.electron.receive(IPC_EVENTS.CHAT_TO_ISLAND, (name, detail) =>
      window.dispatchEvent(new CustomEvent(name, { detail })),
    )
    const forward = (e: Event) =>
      window.electron.send(
        IPC_EVENTS.CHAT_FROM_ISLAND,
        e.type,
        (e as CustomEvent).detail,
      )
    const call = (e: Event) => {
      const number = (e as CustomEvent).detail?.number
      number && window.electron.send(IPC_EVENTS.EMIT_START_CALL, number)
    }
    const notify = (e: Event) => {
      const { peer, name, body } = (e as CustomEvent).detail || {}
      if (!body) return
      const n = new Notification(name || peer, { body })
      n.onclick = () =>
        window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-open', {
          username: peer,
        })
    }
    const error = (e: Event) =>
      Log.warning('chat island', (e as CustomEvent).detail)
    OUT.forEach((n) => window.addEventListener(n, forward))
    window.addEventListener('chat-island-call', call)
    window.addEventListener('chat-island-notify', notify)
    window.addEventListener('chat-island-error', error)
    return () => {
      window.electron.removeAllListeners(IPC_EVENTS.CHAT_TO_ISLAND)
      OUT.forEach((n) => window.removeEventListener(n, forward))
      window.removeEventListener('chat-island-call', call)
      window.removeEventListener('chat-island-notify', notify)
      window.removeEventListener('chat-island-error', error)
    }
  }, [on])

  // The dock and the window header move the whole window; a drag is not a click.
  const moved = useRef(false)
  const onDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const from = { x: e.screenX, y: e.screenY }
    moved.current = false
    window.electron.send(IPC_EVENTS.START_DRAG)
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.screenX - from.x) + Math.abs(ev.screenY - from.y) > 4)
        moved.current = true
    }
    const stop = () => {
      window.electron.send(IPC_EVENTS.STOP_DRAG)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('blur', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('blur', stop)
  }
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!moved.current) return
      moved.current = false
      e.stopPropagation()
      e.preventDefault()
    }
    document.addEventListener('click', click, true)
    return () => document.removeEventListener('click', click, true)
  }, [])

  if (!on) return null
  return (
    <>
      {/* Fixed widths: the island must not shrink to the window it sizes. */}
      <style>{'.chat-island-root > * { flex-shrink: 0 }'}</style>
      <ChatIsland
        dataConfig={dataConfig}
        theme={theme}
        drag={false}
        onDragStart={onDragStart}
        newChatButton={false}
        maxHeads={5}
        notifications='auto'
      />
    </>
  )
}
