import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork } from '@/sdk/mock-network'
import { demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { useSessionStore } from '@/stores/session'
import { keys, pagesOffers, useAccount, useCategories, useFeed, useOffer } from './queries'

const ME = 'PMockUser1111111111111111111111111'

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const sdk = createMockSdk({ network: createMockNetwork(demoNetworkData(ME)) })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.address = ME
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const rpcCalls = (method: string) =>
    sdk.mock.calls.filter((c) => c.method === 'rpc' && c.args[0] === method)
  const mountWith = (setupFn: () => () => unknown) =>
    mount(defineComponent({ setup: setupFn }), {
      global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: client }]] },
    })
  return { sdk, client, rpcCalls, mountWith }
}

describe('queries', () => {
  it('feed pages: «show more» asks the next page at the same height', async () => {
    const { rpcCalls, mountWith } = setup()
    let feed!: ReturnType<typeof useFeed>
    mountWith(() => {
      feed = useFeed({ pageSize: 3 })
      return () => h('div')
    })
    await vi.waitFor(() => expect(feed.data.value?.pages).toHaveLength(1))
    expect(feed.hasNextPage.value).toBe(true)
    const topHeight = feed.data.value!.pages[0]!.topHeight
    expect(topHeight).toBeGreaterThan(0)

    await feed.fetchNextPage()
    expect(pagesOffers(feed.data.value)).toHaveLength(6)
    const second = rpcCalls('getbarteronfeed')[1]!.args[1] as [Record<string, unknown>]
    expect(second[0]).toMatchObject({ pageStart: 1, pageSize: 3, topHeight })
  })

  it('a list seeds single offers: the offer page needs no request', async () => {
    const { client, rpcCalls, mountWith } = setup()
    let feed!: ReturnType<typeof useFeed>
    mountWith(() => {
      feed = useFeed({ pageSize: 2 })
      return () => h('div')
    })
    await vi.waitFor(() => expect(feed.data.value).toBeTruthy())
    const id = feed.data.value!.pages[0]!.offers[0]!.hash!
    expect(client.getQueryData(keys.offer(id))).toMatchObject({ hash: id })

    let offer!: ReturnType<typeof useOffer>
    mountWith(() => {
      offer = useOffer(id)
      return () => h('div')
    })
    await flushPromises()
    expect(offer.data.value?.hash).toBe(id)
    expect(rpcCalls('getbarteronoffersbyroottxhashes')).toHaveLength(0)
  })

  it('cards asking for sellers one by one make one request', async () => {
    const { rpcCalls, mountWith } = setup()
    const accounts: ReturnType<typeof useAccount>[] = []
    mountWith(() => {
      for (const a of [
        SELLERS.anna,
        SELLERS.ilya,
        SELLERS.maria,
        'PNobody1111111111111111111111111',
      ]) {
        accounts.push(useAccount(a))
      }
      return () => h('div')
    })
    await vi.waitFor(() => expect(accounts.every((a) => a.data.value)).toBe(true))
    expect(rpcCalls('getbarteronaccounts')).toHaveLength(1)
    expect(accounts[1]!.data.value).toMatchObject({ address: SELLERS.ilya, rating: 4.9 })
    // No Barteron profile: an empty one.
    expect(accounts[3]!.data.value).toMatchObject({ hash: null, tags: [] })
  })

  it('categories load lazily, names follow the language', async () => {
    const { mountWith } = setup()
    let categories!: ReturnType<typeof useCategories>
    mountWith(() => {
      categories = useCategories()
      return () => h('div')
    })
    await vi.waitFor(() => expect(categories.ready.value).toBe(true))
    expect(categories.label(1006)).toBe('Горные')
    setLocale('en')
    await vi.waitFor(() => expect(categories.label(1006)).toBe('Mountain'))
  })
})
