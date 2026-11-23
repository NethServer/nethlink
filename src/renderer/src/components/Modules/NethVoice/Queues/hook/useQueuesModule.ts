import { useEffect, useMemo, useState } from 'react'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { QueueMemberType, QueueType } from '@shared/types'
import { Log } from '@shared/utils/logger'
import { omit } from 'lodash'

export type QueueMemberStatus = 'loggedIn' | 'paused' | 'loggedOut'

export const getMemberStatus = (
  member?: QueueMemberType,
): QueueMemberStatus => {
  if (!member?.loggedIn) return 'loggedOut'
  return member.paused ? 'paused' : 'loggedIn'
}

// only a static member is always in the queue: any other member, such as a
// dynamic one, can log in and out, as in the CTI
export const isDynamicMember = (member?: QueueMemberType) =>
  !!member && member.type !== 'static'

// the reasons of a pause, sent as they are to the server, as NethVoice CTI
// does, so that the statistics of the queues group them in the same way; an
// empty reason is a generic pause
export const PAUSE_REASONS = [
  '',
  'Lunch break',
  'Emergency',
  'Backend',
] as const
export type PauseReason = (typeof PAUSE_REASONS)[number]

export type QueueAction = 'logIn' | 'logOut' | 'pause' | 'endPause'

export type QueueActionError = {
  action: QueueAction
  // the queue that failed, none when the action was on all the queues
  queue?: QueueType
}

// The server does not keep the reason of a pause, so NethLink remembers the
// one the user chose, per extension, until the pause ends: only this user
// sees it, the others see a generic pause.
const pauseReasonsKey = (extension: string) => `queuePauseReasons-${extension}`

const readPauseReasons = (extension?: string): Record<string, string> => {
  if (!extension) return {}
  try {
    return JSON.parse(localStorage.getItem(pauseReasonsKey(extension)) || '{}')
  } catch {
    return {}
  }
}

const writePauseReasons = (
  extension: string,
  reasons: Record<string, string>,
) => {
  try {
    localStorage.setItem(pauseReasonsKey(extension), JSON.stringify(reasons))
  } catch (e) {
    Log.warning('cannot save the reasons of the pauses', e)
  }
}

export const useQueuesModule = () => {
  const [queues, setQueues] = useNethlinkData('queues')
  const [account] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  // the action in progress on each queue
  const [pendingActions, setPendingActions] = useState<
    Record<string, QueueAction>
  >({})
  // the action in progress on all the queues, if any
  const [allPendingAction, setAllPendingAction] = useState<QueueAction>()
  const [error, setError] = useState<QueueActionError>()

  const mainExtension = account?.data?.endpoints?.mainextension?.[0]?.id
  const [pauseReasons, setPauseReasons] = useState<Record<string, string>>(() =>
    readPauseReasons(mainExtension),
  )

  useEffect(() => {
    setPauseReasons(readPauseReasons(mainExtension))
  }, [mainExtension])

  const updatePauseReasons = (
    update: (reasons: Record<string, string>) => Record<string, string>,
  ) => {
    if (!mainExtension) return
    setPauseReasons((p) => {
      const next = update(p)
      writePauseReasons(mainExtension, next)
      return next
    })
  }

  // the queues the user is a member of, undefined until they are loaded
  const myQueues = useMemo<QueueType[] | undefined>(() => {
    if (!queues) return undefined
    if (!mainExtension) return []
    return Object.values(queues)
      .filter((queue) => !!queue?.members?.[mainExtension])
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.queue.localeCompare(b.queue, undefined, { numeric: true }),
      )
  }, [queues, mainExtension])

  const getMyMember = (queue: QueueType) =>
    mainExtension ? queue.members?.[mainExtension] : undefined

  // the reason of the pause of the user: the server one, if any, or the one
  // chosen in NethLink
  const getMyPauseReason = (queue: QueueType) =>
    getMyMember(queue)?.lastPausedInReason || pauseReasons[queue.queue]

  // the queues where the user can log in and out
  const dynamicQueues = (myQueues || []).filter((q) =>
    isDynamicMember(getMyMember(q)),
  )
  const isLoggedInToAny = dynamicQueues.some((q) => getMyMember(q)?.loggedIn)
  // a pause works in every queue the user is logged in to, static ones too
  const pausableQueues = (myQueues || []).filter(
    (q) => getMemberStatus(getMyMember(q)) === 'loggedIn',
  )
  const pausedQueues = (myQueues || []).filter(
    (q) => getMemberStatus(getMyMember(q)) === 'paused',
  )

  // a pause ended elsewhere, such as in NethVoice CTI, forgets its reason; the
  // queues with an action in progress wait for its result
  useEffect(() => {
    if (!myQueues) return
    const ended = Object.keys(pauseReasons).filter((id) => {
      const queue = myQueues.find((q) => q.queue === id)
      return (
        !pendingActions[id] &&
        (!queue || getMemberStatus(getMyMember(queue)) !== 'paused')
      )
    })
    if (ended.length > 0) updatePauseReasons((p) => omit(p, ended))
  }, [myQueues, pendingActions, pauseReasons])

  // remembers or forgets the reason after a pause action that worked
  const savePauseResult = (
    action: QueueAction,
    queueIds: string[],
    reason?: PauseReason,
  ) => {
    if (action === 'pause') {
      updatePauseReasons((p) => ({
        ...omit(p, queueIds),
        // a generic pause has no reason to remember
        ...(reason
          ? Object.fromEntries(queueIds.map((id) => [id, reason]))
          : {}),
      }))
    } else if (action === 'endPause') {
      updatePauseReasons((p) => omit(p, queueIds))
    }
  }

  async function refreshQueues() {
    try {
      // the full list: a queue no longer on the server goes away
      const updated = await NethVoiceAPI.AstProxy.getQueues()
      setQueues(updated)
    } catch (e) {
      Log.warning('cannot refresh the queues', e)
    }
  }

  async function runAction(
    queue: QueueType,
    action: QueueAction,
    reason: PauseReason = '',
  ) {
    if (!mainExtension) throw new Error('no main extension')
    const { AstProxy } = NethVoiceAPI
    switch (action) {
      case 'logIn':
        return AstProxy.queueMemberAdd(mainExtension, queue.queue)
      case 'logOut':
        return AstProxy.queueMemberRemove(mainExtension, queue.queue)
      case 'pause':
        return AstProxy.queueMemberPause(mainExtension, queue.queue, reason)
      case 'endPause':
        return AstProxy.queueMemberUnpause(mainExtension, queue.queue)
    }
  }

  async function changeQueue(
    queue: QueueType,
    action: QueueAction,
    reason?: PauseReason,
  ) {
    setError(undefined)
    setPendingActions((p) => ({ ...p, [queue.queue]: action }))
    try {
      await runAction(queue, action, reason)
      savePauseResult(action, [queue.queue], reason)
    } catch (e) {
      Log.warning(`cannot ${action} queue ${queue.queue}`, e)
      setError({ action, queue })
    } finally {
      // the socket also updates the member, the refresh covers a lost event
      await refreshQueues()
      setPendingActions((p) => omit(p, queue.queue))
    }
  }

  async function changeAllQueues(
    action: QueueAction,
    targets: QueueType[],
    reason?: PauseReason,
  ) {
    const targetIds = targets.map((q) => q.queue)
    setError(undefined)
    setAllPendingAction(action)
    setPendingActions((p) => ({
      ...p,
      ...Object.fromEntries(targetIds.map((id) => [id, action])),
    }))
    const results = await Promise.allSettled(
      targets.map((q) => runAction(q, action, reason)),
    )
    savePauseResult(
      action,
      targetIds.filter((_, i) => results[i].status === 'fulfilled'),
      reason,
    )
    if (results.some((r) => r.status === 'rejected')) {
      Log.warning(`cannot ${action} all queues`, results)
      setError({ action })
    }
    await refreshQueues()
    // a single queue changed meanwhile keeps its own pending state
    setPendingActions((p) => omit(p, targetIds))
    setAllPendingAction(undefined)
  }

  const toggleLogin = (queue: QueueType) =>
    changeQueue(queue, getMyMember(queue)?.loggedIn ? 'logOut' : 'logIn')

  const pauseQueue = (queue: QueueType, reason: PauseReason) =>
    changeQueue(queue, 'pause', reason)

  const endPauseQueue = (queue: QueueType) => changeQueue(queue, 'endPause')

  // log out of all the queues when logged in to at least one, as the CTI does
  const toggleLoginAll = () =>
    isLoggedInToAny
      ? changeAllQueues(
          'logOut',
          dynamicQueues.filter((q) => getMyMember(q)?.loggedIn),
        )
      : changeAllQueues(
          'logIn',
          dynamicQueues.filter((q) => !getMyMember(q)?.loggedIn),
        )

  const pauseAll = (reason: PauseReason) =>
    changeAllQueues('pause', pausableQueues, reason)

  const endPauseAll = () => changeAllQueues('endPause', pausedQueues)

  return {
    myQueues,
    mainExtension,
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
  }
}
