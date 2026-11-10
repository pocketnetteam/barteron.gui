import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef } from 'vue'
import { resolveLocale, setLocale } from '@/i18n'
import { connect, type ConnectMode, type ConnectOptions } from '@/sdk/connect'
import type { AppInfo, HostSdk } from '@/sdk/types'

export type SessionStatus = 'idle' | 'connecting' | 'ready' | 'outside' | 'failed'

/**
 * - `signed-in` — the address is known;
 * - `no-permission` — the host has not granted `account` (a sideloaded dev build starts here);
 * - `guest` — nobody is signed in to Bastyon.
 */
export type AccountState = 'unknown' | 'signed-in' | 'no-permission' | 'guest'

/** Connection to the Bastyon host and the current user. */
export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('idle')
  const mode = ref<ConnectMode | null>(null)
  const failReason = ref<'script' | 'timeout' | null>(null)
  const appinfo = ref<AppInfo | null>(null)
  const hostTheme = ref<string | null>(null)
  const account = ref<AccountState>('unknown')
  const address = ref<string | null>(null)
  const sdk = shallowRef<HostSdk | null>(null)

  async function start(options: ConnectOptions): Promise<void> {
    status.value = 'connecting'
    failReason.value = null
    const result = await connect(options)

    if (result.status === 'outside') {
      status.value = 'outside'
      return
    }
    if (result.status === 'failed') {
      console.error('[barteron] Bastyon SDK connection failed:', result.error)
      failReason.value = result.reason
      status.value = 'failed'
      return
    }

    sdk.value = markRaw(result.sdk)
    mode.value = result.mode
    appinfo.value = result.appinfo
    hostTheme.value = result.appinfo.theme?.rootid ?? null
    setLocale(resolveLocale(result.appinfo.locale))

    result.sdk.on('theme', (theme) => {
      hostTheme.value = theme.rootid
    })
    result.sdk.on('locale', ({ locale }) => {
      setLocale(resolveLocale(locale))
    })

    await loadAccount()
    status.value = 'ready'
  }

  async function loadAccount(): Promise<void> {
    const host = sdk.value
    if (!host) return

    const granted = await host.permissions.check({ permission: 'account' }).catch(() => false)
    if (!granted) {
      account.value = 'no-permission'
      address.value = null
      return
    }

    try {
      const result = await host.get.account()
      address.value = result.address
      account.value = 'signed-in'
    } catch {
      address.value = null
      account.value = 'guest'
    }
  }

  /** Asks the host for `account`; the host shows its own prompt. */
  async function requestAccountAccess(): Promise<void> {
    await sdk.value?.permissions.request(['account']).catch(() => undefined)
    await loadAccount()
  }

  /** Opens Bastyon's sign-in / registration. */
  async function signIn(): Promise<void> {
    await sdk.value?.helpers.registration().catch(() => undefined)
    await loadAccount()
  }

  return {
    status,
    mode,
    failReason,
    appinfo,
    hostTheme,
    account,
    address,
    sdk,
    start,
    loadAccount,
    requestAccountAccess,
    signIn,
  }
})

/** The connected SDK. Only call once the session is `ready`. */
export function useSdk(): HostSdk {
  const sdk = useSessionStore().sdk
  if (!sdk) throw new Error('sdk_not_ready')
  return sdk
}
