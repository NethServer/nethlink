import { ChatIsland } from '@nethesis/chat-island'
import i18next from 'i18next'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { isDev } from '@shared/utils/utils'
import { useEffect, useMemo, useRef, useState } from 'react'

// Room around the island for its shadows.
const PAD = 24
// Room on both sides of the island for a head's tooltip, kept even when none shows: a window resized on hover jitters.
// The same on both sides (and 2rem above and below), so a new corner leaves the dock where it is.
const TIP = 240
// Linux gets no mouse moves through an ignoring window, so there the window widens for the tooltip instead.
const THROUGH = !navigator.userAgent.includes('Linux')
// The chat windows can move to the CTI, and back from there: the person's choice, kept on the chat server.
const MOVE_TO_CTI = { host: 'cti' as const, label: 'NethVoice CTI' }
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
  // The screen corner nearest the dock, chosen by NethLink after a drag: panels open away from it.
  const [corner, setCorner] = useState<
    'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  >('bottom-right')
  // Where the chat windows live: here, or moved to the CTI (then the island here only listens).
  const [host, setHost] = useState<'nethlink' | 'cti'>('nethlink')
  const hostRef = useRef(host)
  hostRef.current = host

  const allowed =
    !!account?.data?.profile?.macro_permissions?.nethvoice_cti?.permissions
      ?.chat?.value

  // The chat is on for this NethVoice when its gateway answers; asked again every minute until it does.
  useEffect(() => {
    setEnabled(false)
    if (!account?.host || !allowed) return
    let timer: ReturnType<typeof setTimeout> | undefined
    // A probe still in flight after the cleanup must neither enable the chat nor poll again.
    let cancelled = false
    const probe = () =>
      fetch(`https://${account.host}/chat-gw/healthz`)
        .then((r) => (r.ok ? !cancelled && setEnabled(true) : Promise.reject()))
        .catch(() => {
          if (!cancelled) timer = setTimeout(probe, 60 * 1000)
        })
    probe()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
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
    let watched: Element | null = null
    let unhover = () => {}
    let last = ''
    // The island may replace its root: watch whichever one is in the page.
    const timer = setInterval(() => {
      const root = document.querySelector('.chat-island-root')
      if (root === watched) return
      observer?.disconnect()
      observer = undefined
      unhover()
      watched = root
      if (!root) {
        window.electron.send(IPC_EVENTS.CHAT_ISLAND_RESIZE, { w: 0, h: 0 })
        return
      }
      // The size, and where the dock is in the window (NethLink picks the corner from it).
      const send = () => {
        const r = root.getBoundingClientRect()
        const d = root.lastElementChild?.getBoundingClientRect()
        // A head's tooltip sticks out of the island toward the screen.
        const t = THROUGH
          ? undefined
          : [...root.querySelectorAll('[role=tooltip]')]
              .find((e) => e.getClientRects().length)
              ?.getBoundingClientRect()
        const width =
          r.width + (t ? Math.max(0, r.left - t.left, t.right - r.right) : 0)
        const dock = d && { x: d.x, y: d.y, w: d.width, h: d.height }
        const size =
          r.width < 8
            ? { w: 0, h: 0 }
            : THROUGH
              ? {
                  w: Math.ceil(r.width + 2 * TIP),
                  h: Math.ceil(r.height + 64),
                  side: TIP,
                  dock,
                  corner,
                }
              : {
                  w: Math.ceil(width + 16 + PAD),
                  h: Math.ceil(r.height + 20 + PAD),
                  dock,
                  corner,
                }
        // Only real changes: every resize of a transparent window may flicker.
        const key = JSON.stringify(size)
        if (key === last) return
        last = key
        window.electron.send(IPC_EVENTS.CHAT_ISLAND_RESIZE, size)
      }
      observer = new ResizeObserver(send)
      if (!THROUGH) {
        root.addEventListener('mouseover', send)
        root.addEventListener('mouseout', send)
        unhover = () => {
          root.removeEventListener('mouseover', send)
          root.removeEventListener('mouseout', send)
        }
      }
      observer.observe(root)
      if (root.lastElementChild) observer.observe(root.lastElementChild)
    }, 200)
    return () => {
      clearInterval(timer)
      observer?.disconnect()
      unhover()
    }
    // A new corner moves the dock inside the window without resizing it: observe again, which reports at once.
  }, [on, corner])

  // Events between the island and NethLink.
  useEffect(() => {
    if (!on) return
    // Last value of each event, sent again when NethLink (re)loads.
    const last: Record<string, unknown> = {}
    window.electron.receive(IPC_EVENTS.CHAT_TO_ISLAND, (name, detail) => {
      // Opening a chat from NethLink (command bar, notification) brings the chat windows back here.
      if (
        hostRef.current === 'cti' &&
        (name === 'chat-island-open' || name === 'chat-island-new')
      ) {
        window.dispatchEvent(
          new CustomEvent('chat-island-move', {
            detail: { host: 'nethlink', open: detail?.username },
          }),
        )
        if (name === 'chat-island-open') return
      }
      if (name !== 'chat-sync')
        return window.dispatchEvent(new CustomEvent(name, { detail }))
      Object.entries(last).forEach(([n, d]) =>
        window.electron.send(IPC_EVENTS.CHAT_FROM_ISLAND, n, d),
      )
    })
    const forward = (e: Event) => {
      last[e.type] = (e as CustomEvent).detail
      window.electron.send(
        IPC_EVENTS.CHAT_FROM_ISLAND,
        e.type,
        (e as CustomEvent).detail,
      )
    }
    const call = (e: Event) => {
      const number = (e as CustomEvent).detail?.number
      number && window.electron.send(IPC_EVENTS.EMIT_START_CALL, number)
    }
    const notify = (e: Event) => {
      const { peer, name, body, kind, author, text, avatar } =
        (e as CustomEvent).detail || {}
      // Window hidden: the island shows its own notification, one is enough.
      if (!body || document.visibilityState !== 'visible') return
      // Groups: "Author · Group"; the avatar as icon.
      const title = kind === 'group' ? `${author} · ${name}` : name || peer
      const n = new Notification(title, { body: text || body, icon: avatar })
      n.onclick = () =>
        window.electron.send(IPC_EVENTS.CHAT_TO_ISLAND, 'chat-island-open', {
          username: peer,
        })
    }
    const error = (e: Event) =>
      Log.warning('chat island', (e as CustomEvent).detail)
    const moved = (e: Event) => setCorner((e as CustomEvent).detail)
    const where = (e: Event) => {
      const h = (e as CustomEvent).detail?.host
      if (h === 'cti' || h === 'nethlink') setHost(h)
    }
    OUT.forEach((n) => window.addEventListener(n, forward))
    window.addEventListener('chat-island-call', call)
    window.addEventListener('chat-island-notify', notify)
    window.addEventListener('chat-island-error', error)
    window.addEventListener('chat-island-corner', moved)
    window.addEventListener('chat-island-host', where)
    return () => {
      // Chat off: NethLink and the command bar must not keep showing it online.
      window.electron.send(IPC_EVENTS.CHAT_FROM_ISLAND, 'chat-island-status', {
        status: 'offline',
      })
      window.electron.removeAllListeners(IPC_EVENTS.CHAT_TO_ISLAND)
      OUT.forEach((n) => window.removeEventListener(n, forward))
      window.removeEventListener('chat-island-call', call)
      window.removeEventListener('chat-island-notify', notify)
      window.removeEventListener('chat-island-error', error)
      window.removeEventListener('chat-island-corner', moved)
      window.removeEventListener('chat-island-host', where)
    }
  }, [on])

  // The mouse goes through the page where there is no island: the empty root, the body.
  useEffect(() => {
    if (!on || !THROUGH) return
    // Every time: the main process also turns it back on by itself (a cursor out of the island), and drops repeats.
    const set = (v: boolean) =>
      window.electron.send(IPC_EVENTS.CHAT_ISLAND_MOUSE, v)
    const move = (e: MouseEvent) => {
      // A pressed button (a drag, a selection) keeps the window.
      if (e.buttons) return
      const el = e.target as Element
      // Outside the island (the page's own #root fills the window), or between its panels.
      set(
        !el.closest('.chat-island-root') ||
          el.classList.contains('chat-island-root'),
      )
    }
    document.addEventListener('mousemove', move)
    set(true)
    return () => {
      document.removeEventListener('mousemove', move)
      set(false)
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
      {/* Fixed widths: the island must not shrink to the window it sizes, nor its expanded chat stop at it; shadows short enough to end inside PAD. */}
      <style>
        {`html, body { overflow: hidden } ${isDev() ? 'html { background: rgb(185 28 28 / 0.35) }' : ''} ${THROUGH ? `.chat-island-root.ci-right-4 { right: ${TIP}px } .chat-island-root.ci-left-4 { left: ${TIP}px }` : ''} .chat-island-root { --ci-max-w: 100rem; --ci-max-h: 100rem } .chat-island-root > * { flex-shrink: 0 } .chat-island-root .ci-shadow-2xl { --tw-shadow: 0 8px 20px -6px rgb(0 0 0 / 0.25) }`}
      </style>
      <ChatIsland
        dataConfig={dataConfig}
        theme={theme}
        position={corner}
        drag={false}
        onDragStart={onDragStart}
        newChatButton={false}
        maxHeads={5}
        notifications='auto'
        accent='blue'
        language={i18next.language}
        headless={host === 'cti'}
        moveTo={MOVE_TO_CTI}
      />
    </>
  )
}
