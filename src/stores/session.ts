import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef } from 'vue'
import { resolveLocale, setLocale } from '@/i18n'
import { applyHostInsets } from '@/lib/host-insets'
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
  /** Bastyon's language (`ru`, `en-US`…); the user may override it (`useLocaleStore`). */
  const hostLocale = ref<string | null>(
    typeof navigator === 'undefined' ? null : navigator.language
  )
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
    hostLocale.value = result.appinfo.locale ?? null
    setLocale(resolveLocale(hostLocale.value))
    applyHostInsets(result.appinfo)

    // Outside services through the host when it routes traffic through Tor;
    // sdk.js checks `alttransport` itself and returns null otherwise.
    void result.sdk.serviceWorker?.register().catch(() => null)

    result.sdk.on('theme', (theme) => {
      hostTheme.value = theme.rootid
    })
    result.sdk.on('locale', ({ locale }) => {
      hostLocale.value = locale
      setLocale(resolveLocale(locale))
    })

    await loadAccount()
    // The host shows its splash until the app says it is up: bastyon-nextgen
    // waits for `loaded` (`mini-app-frame.vue`), as the old app sent it after init.
    result.sdk.emit('loaded')
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

  const isSignedIn = () => account.value === 'signed-in'

  /**
   * Before an action that needs an account: asks for access or opens
   * sign-in, then says whether the user is signed in now.
   */
  async function ensureSignedIn(): Promise<boolean> {
    if (isSignedIn()) return true
    if (account.value === 'no-permission') await requestAccountAccess()
    else await signIn()
    return isSignedIn()
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
    hostLocale,
    account,
    address,
    sdk,
    start,
    loadAccount,
    requestAccountAccess,
    signIn,
    ensureSignedIn,
  }
})

/** The connected SDK. Only call once the session is `ready`. */
export function useSdk(): HostSdk {
  const sdk = useSessionStore().sdk
  if (!sdk) throw new Error('sdk_not_ready')
  return sdk
}
