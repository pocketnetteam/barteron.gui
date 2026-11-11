import { describe, expect, it } from 'vitest'
import { createMockNotify } from '@/sdk/mock-notify'
import {
  botAccountName,
  createNotifyService,
  NOTIFY_API,
  parseDeliveries,
  parseSubscription,
  type NotifyTransport,
} from './notify'

const ADDRESS = 'PMockUser1111111111111111111111111'

/** Records requests and answers from a table by path. */
function transport(answers: Record<string, { status?: number; body: unknown }>) {
  const calls: { path: string; headers: Record<string, string>; body: unknown }[] = []
  const t: NotifyTransport = {
    sign: async () => ({ signature: 'sig', pubkey: 'pk' }),
    fetch: async (url, init) => {
      const path = url.replace(`${NOTIFY_API}/`, '')
      calls.push({
        path,
        headers: init.headers as Record<string, string>,
        body: JSON.parse(String(init.body)),
      })
      const answer = answers[path] ?? { status: 404, body: { message: 'no route' } }
      return new Response(JSON.stringify(answer.body), { status: answer.status ?? 200 })
    },
  }
  return { t, calls }
}

describe('bot account name, like the old getUsername', () => {
  it('takes @name, name and links', () => {
    expect(botAccountName('telegram', ' @anna_koval ')).toBe('anna_koval')
    expect(botAccountName('telegram', 'https://t.me/anna_koval')).toBe('anna_koval')
    expect(botAccountName('telegram', 't.me/anna_koval/12')).toBe('anna_koval')
    expect(botAccountName('vk', 'vk.com/id123')).toBe('id123')
    expect(botAccountName('vk', 'https://vk.com/anna.k')).toBe('anna.k')
    expect(botAccountName('vk', 'anna.k')).toBe('anna.k')
    expect(botAccountName('vk', '   ')).toBe('')
  })
})

describe('p2p.back answers', () => {
  it('reads a subscription by the channel field', () => {
    expect(parseSubscription('telegram', { telegram: 'anna', isEnabled: true })).toEqual({
      channel: 'telegram',
      enabled: true,
      name: 'anna',
    })
    expect(parseSubscription('vk', { vkScreenName: 'id1', isEnabled: false })?.enabled).toBe(false)
    expect(parseSubscription('vk', null)).toBeNull()
  })

  it('reads deliveries per channel', () => {
    expect(
      parseDeliveries({
        results: { telegram: { status: 'sent' }, vk: { status: 'error', message: 'blocked' } },
      })
    ).toEqual({
      telegram: { status: 'sent', message: '' },
      vk: { status: 'error', message: 'blocked' },
    })
    expect(parseDeliveries({ results: { telegram: { status: 'weird' } } }).telegram?.status).toBe(
      'unknown'
    )
  })
})

describe('notify service: the old requests', () => {
  it('signs every request and connects with the channel field', async () => {
    const { t, calls } = transport({ 'vk-notifications/subscriptions': { body: { ok: true } } })
    await createNotifyService(t).connect('vk', { address: ADDRESS, name: 'id1', locale: 'ru' })
    expect(calls).toHaveLength(1)
    expect(calls[0]!.headers.Signature).toBe(JSON.stringify({ signature: 'sig', pubkey: 'pk' }))
    expect(calls[0]!.headers['Content-Type']).toBe('application/json')
    expect(calls[0]!.body).toEqual({
      address: ADDRESS,
      vkScreenName: 'id1',
      locale: 'ru',
      isEnabled: true,
    })
  })

  it('gets and deletes a subscription by address', async () => {
    const { t, calls } = transport({
      'telegram-notifications/subscriptions/get': {
        body: { subscription: { telegram: 'anna', isEnabled: true } },
      },
      'telegram-notifications/subscriptions/delete': { body: {} },
    })
    const service = createNotifyService(t)
    expect(await service.get('telegram', ADDRESS)).toMatchObject({ name: 'anna', enabled: true })
    await service.disconnect('telegram', ADDRESS)
    expect(calls.map((c) => c.path)).toEqual([
      'telegram-notifications/subscriptions/get',
      'telegram-notifications/subscriptions/delete',
    ])
    expect(calls[1]!.body).toEqual({ address: ADDRESS })
  })

  it('a message goes only to the channels the receiver has on', async () => {
    const { t, calls } = transport({
      'telegram-notifications/subscriptions/get': {
        body: { subscription: { telegram: 'anna', isEnabled: true } },
      },
      'vk-notifications/subscriptions/get': { body: { subscription: null } },
      'notifications/messages': { body: { results: { telegram: { status: 'sent' } } } },
    })
    const result = await createNotifyService(t).send(ADDRESS, 'dialog')
    expect(result).toEqual({ telegram: { status: 'sent', message: '' } })
    const message = calls.find((c) => c.path === 'notifications/messages')!
    expect(message.body).toEqual({
      address: ADDRESS,
      data: { telegram: { messageType: 'dialog' } },
    })
  })

  it('nothing to send when nobody listens', async () => {
    const { t, calls } = transport({
      'telegram-notifications/subscriptions/get': { body: { subscription: null } },
      'vk-notifications/subscriptions/get': { status: 500, body: { message: 'down' } },
    })
    expect(await createNotifyService(t).send(ADDRESS, 'dialog')).toEqual({})
    expect(calls.some((c) => c.path === 'notifications/messages')).toBe(false)
  })

  it('the service message is the error', async () => {
    const { t } = transport({
      'telegram-notifications/subscriptions': { status: 400, body: { message: 'chat not found' } },
    })
    await expect(
      createNotifyService(t).connect('telegram', { address: ADDRESS, name: 'x', locale: 'en' })
    ).rejects.toThrow('chat not found')
  })
})

describe('mock notify', () => {
  it('connects, tests and disconnects in memory', async () => {
    const mock = createMockNotify(0)
    expect(await mock.get('telegram', ADDRESS)).toBeNull()
    await mock.connect('telegram', { address: ADDRESS, name: 'anna', locale: 'ru' })
    expect(await mock.send(ADDRESS, 'test', ['telegram'])).toEqual({
      telegram: { status: 'sent', message: '' },
    })
    expect(mock.sent).toEqual([{ address: ADDRESS, type: 'test', channel: 'telegram' }])
    await mock.disconnect('telegram', ADDRESS)
    expect(await mock.send(ADDRESS, 'test', ['telegram'])).toEqual({})
    await expect(
      mock.connect('vk', { address: ADDRESS, name: '!error', locale: 'ru' })
    ).rejects.toThrow()
  })
})
