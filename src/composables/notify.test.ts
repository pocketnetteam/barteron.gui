import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { useSessionStore } from '@/stores/session'
import { useBotChannel } from './notify'

/**
 * A bot card against the real p2p.back client (not the mock service), with
 * `fetch` stubbed: nothing leaves the test.
 */
async function card(fetcher: typeof fetch) {
  setActivePinia(createPinia())
  setLocale('ru')
  vi.stubGlobal('fetch', fetcher)
  const session = useSessionStore()
  session.sdk = markRaw(createMockSdk({ address: MOCK_ADDRESS, granted: ['sign'] }))
  session.mode = 'bastyon'
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  let bot!: ReturnType<typeof useBotChannel>
  mount(
    defineComponent({
      setup() {
        bot = useBotChannel('telegram', true)
        return () => null
      },
    }),
    { global: { plugins: [i18n] } }
  )
  await flushPromises()
  return bot
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('«Уведомления» with p2p.back out of reach', () => {
  it('a network failure reads «нет связи», not the browser’s «Failed to fetch»', async () => {
    const bot = await card(vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    expect(bot.state).toBe('error')
    expect(bot.error).toBe('нет связи — возможно, сервис закрыт в вашей сети. Попробуйте позже')
  })

  it('the test message failing on the way reads «нет связи» too', async () => {
    let calls = 0
    const bot = await card(
      vi.fn(async () => {
        calls++
        if (calls === 1) {
          return new Response(
            JSON.stringify({ subscription: { telegram: 'anna', isEnabled: true } })
          )
        }
        throw new TypeError('Failed to fetch')
      }) as unknown as typeof fetch
    )
    expect(bot.state).toBe('connected')
    await bot.sendTest()
    expect(bot.test).toEqual({
      kind: 'failed',
      reason: 'нет связи — возможно, сервис закрыт в вашей сети. Попробуйте позже',
    })
  })

  it('the service’s own message stays as it is', async () => {
    const bot = await card(
      vi.fn(async () => new Response(JSON.stringify({ message: 'bad signature' }), { status: 401 }))
    )
    expect(bot.state).toBe('error')
    expect(bot.error).toBe('bad signature')
  })

  it('the request is signed and only the address goes out', async () => {
    const fetcher = vi.fn(
      async () => new Response(JSON.stringify({ subscription: null }), { status: 200 })
    )
    const bot = await card(fetcher as unknown as typeof fetch)
    expect(bot.state).toBe('disconnected')
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(
      'https://p2p.back.pocketnet.app/barteron/telegram-notifications/subscriptions/get'
    )
    expect(JSON.parse(String(init.body))).toEqual({ address: MOCK_ADDRESS })
    // The host's signature object of `auth/<app id>`, as JSON.
    expect(JSON.parse((init.headers as Record<string, string>).Signature!)).toMatchObject({
      nonce: 'auth/barteron.pocketnet.app',
      address: MOCK_ADDRESS,
    })
  })
})
