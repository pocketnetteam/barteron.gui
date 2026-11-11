/**
 * p2p.back for the SDK mock: subscriptions in memory, nothing leaves the
 * browser. Magic for trying failures by hand: an account name starting with
 * `!error` is refused on connect; `!silent` connects, but a test message
 * does not reach it (the bot never saw the user's «barteron»).
 */

import {
  NotifyError,
  type NotifyChannel,
  type NotifyDelivery,
  type NotifyService,
  type NotifySubscription,
} from '@/api/notify'

export interface MockNotify extends NotifyService {
  /** Messages «sent», newest last: for tests. */
  readonly sent: { address: string; type: string; channel: NotifyChannel }[]
}

export function createMockNotify(delayMs = 300): MockNotify {
  const subscriptions = new Map<string, NotifySubscription>()
  const sent: MockNotify['sent'] = []
  const key = (channel: NotifyChannel, address: string) => `${channel}:${address}`
  const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs))

  return {
    sent,
    async get(channel, address) {
      await wait()
      return subscriptions.get(key(channel, address)) ?? null
    },
    async connect(channel, { address, name }) {
      await wait()
      if (name.startsWith('!error')) throw new NotifyError('bot did not find the chat', 400)
      subscriptions.set(key(channel, address), { channel, enabled: true, name })
    },
    async disconnect(channel, address) {
      await wait()
      subscriptions.delete(key(channel, address))
    },
    async send(address, type, channels = ['telegram', 'vk']) {
      await wait()
      const out: Partial<Record<NotifyChannel, NotifyDelivery>> = {}
      for (const channel of channels) {
        const s = subscriptions.get(key(channel, address))
        if (!s?.enabled) continue
        if (s.name.startsWith('!silent')) {
          out[channel] = { status: 'error', message: 'chat not found' }
          continue
        }
        sent.push({ address, type, channel })
        out[channel] = { status: 'sent', message: '' }
      }
      return out
    },
  }
}
