import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import { useSessionStore } from '@/stores/session'
import { useMyExchanges } from './exchanges'

const ME = MOCK_ADDRESS

const offer = (id: string, author: string, tag: number, accepts: number[]): RawTx => ({
  hash: id,
  type: TX_TYPE.offer,
  height: 4_100_000,
  time: Math.floor(Date.now() / 1000),
  s1: author,
  s2: id,
  p: {
    s1: 'ru-RU',
    s2: `Объявление ${tag}`,
    s3: '',
    s4: JSON.stringify({ t: tag, a: accepts, c: 'used', p: 'published' }),
    s6: 'ucfv0',
    i1: 100,
  },
})

function setup(offers: RawTx[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const data = demoNetworkData(ME)
  // Only these offers: the demo ones would match too.
  const network = createMockNetwork({ ...data, offers })
  const sdk = createMockSdk({ network })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.account = 'signed-in'
  session.address = ME
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: ReturnType<typeof useMyExchanges>
  mount(
    defineComponent({
      setup() {
        result = useMyExchanges()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: client }]] } }
  )
  return { result, sdk }
}

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})

describe('my exchanges', () => {
  it('one offer that fits two of mine is one exchange in the menu, as in the section', async () => {
    const [GUITAR, LAPTOP, BIKE] = ['a', 'b', 'c'].map((c) => c.repeat(64)) as [
      string,
      string,
      string,
    ]
    const { result } = setup([
      // Mine: a guitar and a laptop, each for a mountain bike.
      offer(GUITAR, ME, 621, [1006]),
      offer(LAPTOP, ME, 58068, [1006]),
      // Анна's bike: she takes a guitar or a laptop.
      offer(BIKE, SELLERS.anna, 1006, [621, 58068]),
    ])
    await vi.waitFor(() =>
      expect(result.states.value.map((s) => s.status)).toEqual(['ready', 'ready'])
    )
    // Each of my offers has the bike…
    expect(result.states.value.map((s) => s.count)).toEqual([1, 1])
    // …but it is one exchange to look at.
    expect(result.unique.value.map((m) => m.target.hash)).toEqual([BIKE])
    expect(result.total.value).toBe(1)
  })

  it('direct for one of mine, a chain for another: shown as the direct exchange', async () => {
    const [GUITAR, LAPTOP, BIKE, SOFA] = ['a', 'b', 'c', 'd'].map((c) => c.repeat(64)) as [
      string,
      string,
      string,
      string,
    ]
    const { result } = setup([
      offer(GUITAR, ME, 621, [1006]),
      offer(LAPTOP, ME, 58068, [1006]),
      // Анна's bike takes a guitar (direct for the guitar) or a sofa…
      offer(BIKE, SELLERS.anna, 1006, [621, 3000]),
      // …and Илья's sofa takes a laptop: laptop → Илья, sofa → Анна, bike → me.
      offer(SOFA, SELLERS.ilya, 3000, [58068]),
    ])
    await vi.waitFor(() =>
      expect(result.states.value.map((s) => s.status)).toEqual(['ready', 'ready'])
    )
    expect(
      result.states.value.map((s) => [s.exchanges?.direct.length, s.exchanges?.chains.length])
    ).toEqual([
      [1, 0],
      [0, 1],
    ])
    expect(result.unique.value.map((m) => [m.target.hash, m.kind])).toEqual([[BIKE, 'direct']])
  })

  it('my own offers are not asked for', async () => {
    const { result, sdk } = setup([offer('a'.repeat(64), ME, 621, [1006])])
    await vi.waitFor(() => expect(result.states.value.map((s) => s.status)).toEqual(['ready']))
    for (const method of ['getbarterondeals', 'getbarteroncomplexdeals']) {
      const call = sdk.mock.calls.find((c) => c.method === 'rpc' && c.args[0] === method)!
      expect((call.args[1] as [{ excludeAddresses: string[] }])[0].excludeAddresses).toEqual([ME])
    }
  })
})

describe('direct exchanges with subcategories, both ways', () => {
  it('their offer under a category I want, accepting a category above mine', async () => {
    const [GUITAR, BIKE, SOFA] = ['a', 'c', 'd'].map((c) => c.repeat(64)) as [
      string,
      string,
      string,
    ]
    const { result } = setup([
      // Mine: an acoustic guitar (621) for «Велосипеды» (1001), any kind.
      offer(GUITAR, ME, 621, [1001]),
      // Анна's mountain bike (1006, under 1001) for «Гитары и оборудование» (620, above 621).
      offer(BIKE, SELLERS.anna, 1006, [620]),
      // Ильи's sofa takes guitars too, but I do not want a sofa.
      offer(SOFA, SELLERS.ilya, 3000, [620]),
    ])
    await vi.waitFor(() => expect(result.states.value.map((s) => s.status)).toEqual(['ready']))
    expect(result.unique.value.map((m) => m.target.hash)).toEqual([BIKE])
  })
})
