import { useMemo, useState } from 'react'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { QueueMemberType, QueueType } from '@shared/types'
import { Log } from '@shared/utils/logger'

export type QueueMemberStatus = 'signedIn' | 'paused' | 'signedOut'

export const getMemberStatus = (
  member?: QueueMemberType,
): QueueMemberStatus => {
  if (!member?.loggedIn) return 'signedOut'
  return member.paused ? 'paused' : 'signedIn'
}

// only a dynamic member can sign in and out, a static one is always in the queue
export const isDynamicMember = (member?: QueueMemberType) =>
  member?.type === 'dynamic'

export type QueueAction = 'signIn' | 'signOut'

export type QueueActionError = {
  action: QueueAction
  // the queue that failed, none when the action was on all the queues
  queue?: QueueType
}

export const useQueuesModule = () => {
  const [queues, setQueues] = useNethlinkData('queues')
  const [account] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  // the queues with an action in progress
  const [pendingQueues, setPendingQueues] = useState<string[]>([])
  const [isAllPending, setIsAllPending] = useState<boolean>(false)
  const [error, setError] = useState<QueueActionError>()

  const mainExtension = account?.data?.endpoints?.mainextension?.[0]?.id

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

  // the queues where the user can sign in or out
  const dynamicQueues = useMemo(
    () => (myQueues || []).filter((q) => isDynamicMember(getMyMember(q))),
    [myQueues],
  )
  const isSignedInToAny = dynamicQueues.some((q) => getMyMember(q)?.loggedIn)

  async function refreshQueues() {
    try {
      const updated = await NethVoiceAPI.AstProxy.getQueues()
      setQueues((p) => ({ ...p, ...updated }))
    } catch (e) {
      Log.warning('cannot refresh the queues', e)
    }
  }

  async function changeMembership(queue: QueueType, action: QueueAction) {
    if (!mainExtension) throw new Error('no main extension')
    if (action === 'signIn') {
      await NethVoiceAPI.AstProxy.queueMemberAdd(mainExtension, queue.queue)
    } else {
      await NethVoiceAPI.AstProxy.queueMemberRemove(mainExtension, queue.queue)
    }
  }

  async function toggleQueue(queue: QueueType) {
    const action: QueueAction = getMyMember(queue)?.loggedIn
      ? 'signOut'
      : 'signIn'
    setError(undefined)
    setPendingQueues((p) => [...p, queue.queue])
    try {
      await changeMembership(queue, action)
    } catch (e) {
      Log.warning(`cannot ${action} queue ${queue.queue}`, e)
      setError({ action, queue })
    } finally {
      // the socket also updates the member, the refresh covers a lost event
      await refreshQueues()
      setPendingQueues((p) => p.filter((q) => q !== queue.queue))
    }
  }

  // sign out of all the queues when signed in to at least one, as the CTI does
  async function toggleAllQueues() {
    const action: QueueAction = isSignedInToAny ? 'signOut' : 'signIn'
    const targets = dynamicQueues.filter((q) =>
      action === 'signIn'
        ? !getMyMember(q)?.loggedIn
        : getMyMember(q)?.loggedIn,
    )
    setError(undefined)
    setIsAllPending(true)
    setPendingQueues(targets.map((q) => q.queue))
    const results = await Promise.allSettled(
      targets.map((q) => changeMembership(q, action)),
    )
    if (results.some((r) => r.status === 'rejected')) {
      Log.warning(`cannot ${action} all queues`, results)
      setError({ action })
    }
    await refreshQueues()
    setPendingQueues([])
    setIsAllPending(false)
  }

  return {
    myQueues,
    mainExtension,
    getMyMember,
    dynamicQueues,
    isSignedInToAny,
    pendingQueues,
    isAllPending,
    error,
    toggleQueue,
    toggleAllQueues,
  }
}
