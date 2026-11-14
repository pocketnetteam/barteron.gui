/**
 * Notifications in Telegram and VK through `p2p.back.pocketnet.app/barteron`,
 * the same requests as the old app (barteron.gui `src/js/notificationUtils.js`):
 * every request is a POST signed by the user (`sdk.sign('auth')` in the
 * `Signature` header), so the service knows whose subscription it is.
 *
 * - a subscription per channel: `<channel>-notifications/subscriptions` (create),
 *   `…/get`, `…/delete`, by address;
 * - a message: `notifications/messages` with `{address, data: {telegram: {messageType}}}`;
 *   it goes only to the channels the receiver has switched on.
 *
 * Only the fact of a new dialog leaves Bastyon: no names, no links.
 */

import { isJsonObject, str } from '@/models/tx'

export const NOTIFY_API = 'https://p2p.back.pocketnet.app/barteron'

export type NotifyChannel = 'telegram' | 'vk'
export const NOTIFY_CHANNELS: readonly NotifyChannel[] = ['telegram', 'vk']

export const BOT_LINKS: Readonly<Record<NotifyChannel, string>> = {
  telegram: 'https://t.me/barteron_notify_bot',
  vk: 'https://vk.com/barteron_notify',
}

const PATHS: Readonly<Record<NotifyChannel, string>> = {
  telegram: 'telegram-notifications',
  vk: 'vk-notifications',
}

/** The field the service keeps the account name in. */
const NAME_FIELDS: Readonly<Record<NotifyChannel, string>> = {
  telegram: 'telegram',
  vk: 'vkScreenName',
}

export interface NotifySubscription {
  channel: NotifyChannel
  enabled: boolean
  /** Telegram username or VK screen name, as the user gave it. */
  name: string
}

/** `dialog` — someone started a chat with you; `test` — «Отправить тестовое». */
export type NotifyMessage = 'dialog' | 'test'

/** What the service did with a message on one channel. */
export interface NotifyDelivery {
  status: 'sent' | 'disabled' | 'not_found' | 'error' | 'unknown'
  message: string
}

export interface NotifyService {
  get(channel: NotifyChannel, address: string): Promise<NotifySubscription | null>
  connect(
    channel: NotifyChannel,
    request: { address: string; name: string; locale: string }
  ): Promise<void>
  disconnect(channel: NotifyChannel, address: string): Promise<void>
  /**
   * A message to the channels `address` has on. Resolves with what happened
   * per channel; channels without a subscription are left out.
   */
  send(
    address: string,
    type: NotifyMessage,
    channels?: readonly NotifyChannel[]
  ): Promise<Partial<Record<NotifyChannel, NotifyDelivery>>>
}

export function parseSubscription(
  channel: NotifyChannel,
  value: unknown
): NotifySubscription | null {
  if (!isJsonObject(value)) return null
  return { channel, enabled: value.isEnabled === true, name: str(value[NAME_FIELDS[channel]]) }
}

const DELIVERY = new Set(['sent', 'disabled', 'not_found', 'error'])

export function parseDeliveries(value: unknown): Partial<Record<NotifyChannel, NotifyDelivery>> {
  const results = isJsonObject(value) && isJsonObject(value.results) ? value.results : {}
  const out: Partial<Record<NotifyChannel, NotifyDelivery>> = {}
  for (const channel of NOTIFY_CHANNELS) {
    const r = results[channel]
    if (!isJsonObject(r)) continue
    const status = str(r.status)
    out[channel] = {
      status: (DELIVERY.has(status) ? status : 'unknown') as NotifyDelivery['status'],
      message: str(r.message),
    }
  }
  return out
}

/**
 * The account name from what the user typed: `@name`, `name`, or a link
 * (`t.me/name`, `https://vk.com/name`), like the old `getUsername`.
 */
export function botAccountName(channel: NotifyChannel, input: string): string {
  const value = input.trim()
  const domain = channel === 'telegram' ? 't.me' : 'vk.com'
  if (value.includes(domain)) {
    try {
      const url = new URL(/^https?:\/\//.test(value) ? value : `https://${value}`)
      return url.pathname.split('/').filter(Boolean)[0] ?? ''
    } catch {
      return ''
    }
  }
  return value.replace(/@/g, '')
}

export class NotifyError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    /** No answer at all: a network failure or the time ran out (blocked, Tor, down). */
    readonly offline = false
  ) {
    super(message)
  }
}

/** As long as for rates and Nominatim: a blocked service must not keep the screen waiting. */
export const P2P_TIMEOUT_MS = 15_000

/**
 * `fetch` with a time limit, its JSON read in it too; `null` when the body is
 * not JSON. Rejects with `offline` on no answer. Not `AbortSignal.timeout`:
 * Safari 15 lacks it.
 */
export async function postJson(
  fetcher: (url: string, init: RequestInit) => Promise<Response>,
  url: string,
  init: RequestInit
): Promise<{ response: Response; result: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), P2P_TIMEOUT_MS)
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal })
    const result: unknown = await response.json().catch(() => null)
    return { response, result }
  } catch (e) {
    const timeout = controller.signal.aborted
    throw new NotifyError(
      timeout ? 'timeout' : e instanceof Error ? e.message : String(e),
      null,
      true
    )
  } finally {
    clearTimeout(timer)
  }
}

export interface NotifyTransport {
  /** `sdk.sign('auth')`: the signature the service checks. */
  sign(): Promise<unknown>
  fetch(url: string, init: RequestInit): Promise<Response>
}

export function createNotifyService(transport: NotifyTransport): NotifyService {
  async function post(path: string, body: unknown): Promise<unknown> {
    const signature = await transport.sign()
    const { response, result } = await postJson(transport.fetch, `${NOTIFY_API}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Signature: JSON.stringify(signature) },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const message = isJsonObject(result) ? str(result.message) : ''
      throw new NotifyError(message || `HTTP error: ${response.status}`, response.status)
    }
    return result
  }

  const service: NotifyService = {
    async get(channel, address) {
      const result = await post(`${PATHS[channel]}/subscriptions/get`, { address })
      return parseSubscription(channel, isJsonObject(result) ? result.subscription : null)
    },
    async connect(channel, { address, name, locale }) {
      await post(`${PATHS[channel]}/subscriptions`, {
        address,
        [NAME_FIELDS[channel]]: name,
        locale,
        isEnabled: true,
      })
    },
    async disconnect(channel, address) {
      await post(`${PATHS[channel]}/subscriptions/delete`, { address })
    },
    async send(address, type, channels = NOTIFY_CHANNELS) {
      const found = await Promise.allSettled(channels.map((c) => service.get(c, address)))
      const on = found.flatMap((r) =>
        r.status === 'fulfilled' && r.value?.enabled ? [r.value] : []
      )
      // Not one channel could be asked: the service is out of reach, not «no subscription».
      const failed = found.find((r) => r.status === 'rejected')
      if (failed && found.every((r) => r.status === 'rejected')) throw failed.reason
      if (!on.length) return {}
      const data = Object.fromEntries(on.map((s) => [s.channel, { messageType: type }]))
      return parseDeliveries(await post('notifications/messages', { address, data }))
    },
  }
  return service
}
