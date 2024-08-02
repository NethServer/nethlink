import { store } from '@/lib/mainStore'
import { onAppResume, onAppSuspend } from '@/main'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { log } from '@shared/utils/logger'
import { delay } from '@shared/utils/utils'


// TODO: ONLY FOR TEST PURPOSE - delete all references before PR
export async function testNethlink() {
  await delay(10000)
  store.set('account', {
    ...store.store.account,
    accessToken: '1234'
  })
  log(store.store.account?.accessToken)
  try {
    const { NethVoiceAPI } = useNethVoiceAPI(store.store['account'])
    const me = await NethVoiceAPI.User.me()
    log('me', { me })
  } catch (e) {
    log(e)
  }
  await delay(100)
  onAppSuspend()
  await delay(3000)
  await onAppResume()
  log(store.store.account?.accessToken)
}
