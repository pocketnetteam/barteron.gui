import { computed, reactive, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  botAccountName,
  createNotifyService,
  NOTIFY_CHANNELS,
  type NotifyChannel,
  type NotifyService,
  type NotifySubscription,
} from '@/api/notify'
import { createMockNotify, type MockNotify } from '@/sdk/mock-notify'
import type { ConnectMode } from '@/sdk/connect'
import type { HostSdk } from '@/sdk/types'
import { useNotifyPrefsStore } from '@/stores/notify-prefs'
import { useSessionStore } from '@/stores/session'

const services = new WeakMap<HostSdk, NotifyService>()

/** p2p.back for the connected host; the mock keeps subscriptions in memory and never goes out. */
export function notifyServiceFor(sdk: HostSdk, mode: ConnectMode | null): NotifyService {
  const cached = services.get(sdk)
  if (cached) return cached
  let service: NotifyService
  if (mode === 'mock') {
    const mock: MockNotify = createMockNotify()
    // e2e reads what was «sent».
    if (typeof window !== 'undefined') {
      ;(window as { __barteronNotify?: MockNotify }).__barteronNotify = mock
    }
    service = mock
  } else {
    service = createNotifyService({
      sign: () => sdk.sign('auth'),
      fetch: (url, init) => fetch(url, init),
    })
  }
  services.set(sdk, service)
  return service
}

const canSign = (sdk: HostSdk) => sdk.permissions.check({ permission: 'sign' }).catch(() => false)

/**
 * «Кто-то начал с вами диалог» to the other members' Telegram and VK, after a
 * chat opened (old `sendNotifications(members, 'dialog')`). Quiet: without
 * the `sign` permission or when p2p.back is down, nothing happens.
 */
export function useDialogNotifier() {
  const session = useSessionStore()
  // Made now, not at the first chat: the mock's state is there for e2e from the start.
  if (session.sdk) notifyServiceFor(session.sdk, session.mode)
  return (members: readonly string[]) => {
    const sdk = session.sdk
    if (!sdk) return
    const service = notifyServiceFor(sdk, session.mode)
    void (async () => {
      if (!(await canSign(sdk))) return
      const results = await Promise.allSettled(
        members.filter((m) => m && m !== session.address).map((m) => service.send(m, 'dialog'))
      )
      for (const r of results)
        if (r.status === 'rejected') console.error('[barteron] notify:', r.reason)
    })()
  }
}

/**
 * p2p.back takes only signed requests: is `sign` granted. `null` while asking
 * the host. One check for the whole «Уведомления» screen.
 */
export function useSignPermission() {
  const session = useSessionStore()
  const granted = ref<boolean | null>(null)
  async function check() {
    const sdk = session.sdk
    granted.value = sdk ? await canSign(sdk) : false
  }
  async function request() {
    await session.sdk?.permissions.request(['sign']).catch(() => undefined)
    await check()
  }
  watch(() => session.sdk, check, { immediate: true })
  return { granted, request }
}

export type BotState =
  | 'idle'
  /** The host has not given `sign`: p2p.back needs a signature. */
  | 'permission'
  | 'loading'
  | 'connected'
  | 'disconnected'
  | 'error'

export type TestState = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'failed'; reason: string }

/**
 * One bot card on «Уведомления»: its subscription, connecting by the account
 * name, a test message and disconnecting. States follow the old
 * notifications banner.
 */
export function useBotChannel(channel: NotifyChannel, signing: MaybeRefOrGetter<boolean | null>) {
  const { t, locale } = useI18n()
  const session = useSessionStore()
  const prefs = useNotifyPrefsStore()
  const state = ref<BotState>('idle')
  const subscription = ref<NotifySubscription | null>(null)
  const error = ref('')
  const input = ref('')
  /** «Укажите username»: shown after a try with an empty field. */
  const inputError = ref('')
  const busy = ref(false)
  const test = ref<TestState>({ kind: 'idle' })
  /** The user opened the bot: step 1 is ticked. */
  const botOpened = ref(false)

  const service = computed(() => (session.sdk ? notifyServiceFor(session.sdk, session.mode) : null))

  function fail(e: unknown) {
    console.error(`[barteron] ${channel} notifications:`, e)
    error.value = e instanceof Error ? e.message : String(e)
    state.value = 'error'
  }

  async function load() {
    const me = session.address
    if (!me || !service.value) return
    const allowed = toValue(signing)
    if (!allowed) {
      state.value = allowed === false ? 'permission' : 'idle'
      return
    }
    state.value = 'loading'
    try {
      const found = await service.value.get(channel, me)
      subscription.value = found?.enabled ? found : null
      state.value = subscription.value ? 'connected' : 'disconnected'
      prefs.setConnected(channel, !!subscription.value)
    } catch (e) {
      fail(e)
    }
  }

  async function connect() {
    const me = session.address
    const name = botAccountName(channel, input.value)
    inputError.value = name ? '' : t(`notify.${channel}.nameMissing`)
    if (!name || !me || !service.value || busy.value) return
    busy.value = true
    try {
      await service.value.connect(channel, { address: me, name, locale: locale.value })
      subscription.value = { channel, enabled: true, name }
      state.value = 'connected'
      test.value = { kind: 'idle' }
      input.value = ''
      prefs.setConnected(channel, true)
    } catch (e) {
      fail(e)
    } finally {
      busy.value = false
    }
  }

  async function disconnect() {
    const me = session.address
    if (!me || !service.value || busy.value) return
    busy.value = true
    try {
      await service.value.disconnect(channel, me)
      subscription.value = null
      state.value = 'disconnected'
      test.value = { kind: 'idle' }
      prefs.setConnected(channel, false)
    } catch (e) {
      fail(e)
    } finally {
      busy.value = false
    }
  }

  async function sendTest() {
    const me = session.address
    if (!me || !service.value || test.value.kind === 'sending') return
    test.value = { kind: 'sending' }
    try {
      const result = (await service.value.send(me, 'test', [channel]))[channel]
      if (result?.status === 'sent') test.value = { kind: 'sent' }
      else
        test.value = {
          kind: 'failed',
          reason:
            result?.status === 'error' && result.message
              ? result.message
              : t(`notify.testReason.${result?.status ?? 'not_found'}`),
        }
    } catch (e) {
      test.value = { kind: 'failed', reason: e instanceof Error ? e.message : String(e) }
    }
  }

  watch(
    () => [session.address, session.sdk, toValue(signing)] as const,
    () => {
      subscription.value = null
      test.value = { kind: 'idle' }
      void load()
    },
    { immediate: true }
  )

  return reactive({
    channel,
    state,
    subscription,
    error,
    input,
    inputError,
    busy,
    test,
    botOpened,
    load,
    connect,
    disconnect,
    sendTest,
  })
}

export { NOTIFY_CHANNELS }
