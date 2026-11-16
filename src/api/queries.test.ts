import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { BAN_LIST } from '@/config/ban-list'
import { i18n, setLocale } from '@/i18n'
import type { Offer } from '@/models/offer'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork } from '@/sdk/mock-network'
import { demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { useSessionStore } from '@/stores/session'
import {
  createQueryClient,
  keys,
  pagesOffers,
  refreshAfterTx,
  useAccount,
  useCategories,
  useFeed,
  useOffer,
} from './queries'

const ME = 'PMockUser1111111111111111111111111'

function setup(extraOffers: RawTx[] = []) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const data = demoNetworkData(ME)
  const network = createMockNetwork({ ...data, offers: [...data.offers!, ...extraOffers] })
  const sdk = createMockSdk({ network })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.address = ME
  // The app's own client: how long data stays fresh is part of what is tested.
  const client = createQueryClient()
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } })
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

  it('«show more» after a hidden offer on top: nothing is skipped', async () => {
    // The newest offer is a banned author's: the list hides it, but the next
    // page must still be read below it, or the offer right after the first page is lost.
    const spam: RawTx = {
      hash: 'b'.repeat(64),
      type: TX_TYPE.offer,
      height: 4_100_000,
      time: Math.floor(Date.now() / 1000),
      s1: BAN_LIST[0]!,
      s2: 'b'.repeat(64),
      p: {
        s1: 'ru-RU',
        s2: 'Спам',
        s3: 'Спам',
        s4: '{"t":1006,"a":[],"c":"new"}',
        s6: 'srywc',
        i1: 1,
      },
    }
    const { mountWith } = setup([spam])
    let all!: ReturnType<typeof useFeed>
    let paged!: ReturnType<typeof useFeed>
    mountWith(() => {
      all = useFeed({ pageSize: 100 })
      paged = useFeed({ pageSize: 3 })
      return () => h('div')
    })
    await vi.waitFor(() => expect(all.data.value && paged.data.value).toBeTruthy())
    expect(paged.data.value!.pages[0]!.topHeight).toBe(4_100_000)
    await paged.fetchNextPage()
    const expected = pagesOffers(all.data.value).slice(0, 5)
    expect(pagesOffers(paged.data.value).map((o) => o.hash)).toEqual(expected.map((o) => o.hash))
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

    // Next to it, an offer not on the page: its request shows the batch went.
    const seeded = feed.data.value!.pages[0]!.offers.map((o) => o.hash)
    const other = demoNetworkData(ME).offers!.find((o) => !seeded.includes(o.hash))!.hash!
    let offer!: ReturnType<typeof useOffer>
    let otherOffer!: ReturnType<typeof useOffer>
    mountWith(() => {
      offer = useOffer(id)
      otherOffer = useOffer(other)
      return () => h('div')
    })
    await vi.waitFor(() => expect(otherOffer.data.value?.hash).toBe(other))
    expect(offer.data.value?.hash).toBe(id)
    const asked = rpcCalls('getbarteronoffersbyroottxhashes').flatMap(
      (c) => (c.args[1] as string[][])[0]!
    )
    expect(asked).toEqual([other])
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
    void setLocale('en')
    await vi.waitFor(() => expect(categories.label(1006)).toBe('Mountain'))
  })
})

it('pages: an offer on two pages shows once', () => {
  const offer = (hash: string) => ({ hash }) as Offer
  const page = (...hashes: string[]) => ({ offers: hashes.map(offer), received: hashes.length })
  const data = { pages: [page('a', 'b'), page('b', 'c')], pageParams: [] }
  expect(pagesOffers(data).map((o) => o.hash)).toEqual(['a', 'b', 'c'])
})

describe('after a transaction is in a block', () => {
  /** Every kind of data, marked once refreshed. */
  function cache() {
    const client = new QueryClient()
    const all: Record<string, readonly unknown[]> = {
      feed: keys.feed({ pageSize: 10 }),
      deals: keys.deals({ theirTags: [1], myTags: [2] }),
      // The keys the app asks with: a list moved off `keys.feeds` shows here.
      matches: keys.matches('6:1006', ME, ['ucfv']),
      nearby: keys.nearbyPlace('ucfv'),
      offer: keys.offer('t1'),
      otherOffer: keys.offer('t2'),
      mine: keys.offersByAddress(ME),
      account: keys.account('t1'),
      details: keys.offerDetails('t1'),
      score: keys.score('t1'),
      sellerDetails: keys.offersDetails(['t3', 't1']),
      deal: keys.deal('t1'),
      balance: keys.balance(ME),
      profile: keys.profile(ME),
      categories: keys.categoryTree,
    }
    for (const key of Object.values(all)) client.setQueryData(key, 1)
    const refreshed = () =>
      Object.entries(all)
        .filter(([, key]) => client.getQueryState(key)?.isInvalidated)
        .map(([name]) => name)
        .sort()
    return { client, refreshed }
  }

  const offerLists = ['deals', 'feed', 'matches', 'mine', 'nearby', 'offer']
  it.each([
    ['offer', offerLists],
    ['offerRemove', offerLists],
    // My profile: only exchanges follow «мой список», not every feed.
    ['account', ['account', 'deals', 'matches']],
    ['review', ['details', 'score', 'sellerDetails']],
    ['vote', ['details', 'score', 'sellerDetails']],
    ['payment', ['balance', 'deal']],
  ] as const)('%s refreshes %j and nothing else', (kind, expected) => {
    const { client, refreshed } = cache()
    refreshAfterTx(client, { kind, target: 't1', status: 'done' }, ME)
    expect(refreshed()).toEqual([...expected].sort())
  })

  it('nothing before the block', () => {
    const { client, refreshed } = cache()
    for (const status of ['sending', 'waiting', 'failed'] as const) {
      refreshAfterTx(client, { kind: 'offer', target: 't1', status }, ME)
    }
    expect(refreshed()).toEqual([])
  })
})
