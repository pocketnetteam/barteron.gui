import { describe, expect, it } from 'vitest'
import { BAN_LIST } from '@/config/ban-list'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork } from '@/sdk/mock-network'
import { demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { BarteronApi, searchPattern } from './barteron'

const ME = 'PMockUser1111111111111111111111111'
const BANNED = BAN_LIST[0]!

function setup(extraOffers: RawTx[] = []) {
  const data = demoNetworkData(ME)
  const network = createMockNetwork({ ...data, offers: [...data.offers!, ...extraOffers] })
  const sdk = createMockSdk({ network })
  return { sdk, api: new BarteronApi(sdk), data }
}

const offerFrom = (author: string, id: string): RawTx => ({
  hash: id,
  type: TX_TYPE.offer,
  height: 3_200_000,
  time: Math.floor(Date.now() / 1000),
  s1: author,
  s2: id,
  p: {
    s1: 'ru-RU',
    s2: 'Спам',
    s3: 'Спам',
    s4: '{"t":1006,"a":[],"c":"new","p":"published"}',
    s6: 'srywc',
    i1: 100,
  },
})

describe('BarteronApi', () => {
  it('feed: offers newest first, request passed to the node as the old app sent it', async () => {
    const { sdk, api } = setup()
    const offers = await api.feed({ pageSize: 5, orderBy: 'height', orderDesc: true })
    expect(offers).toHaveLength(5)
    expect(offers[0]!.caption).toBe('Велосипед горный, рама M')
    const call = sdk.mock.calls.find((c) => c.method === 'rpc')!
    expect(call.args).toEqual([
      'getbarteronfeed',
      [{ pageSize: 5, orderBy: 'height', orderDesc: true }],
    ])
  })

  it('feed: search, category and price filters', async () => {
    const { api } = setup()
    expect((await api.feed({ search: searchPattern('гитар') })).map((o) => o.tag)).toEqual([621])
    expect((await api.feed({ tags: [1006] }))[0]!.caption).toMatch(/Велосипед/)
    const cheap = await api.feed({ priceMax: 100000 })
    expect(cheap.every((o) => o.priceCents <= 100000)).toBe(true)
  })

  it('hides banned authors everywhere, but counts them for paging', async () => {
    const { api } = setup([offerFrom(BANNED, 'b'.repeat(64))])
    const page = await api.feedPage({ pageSize: 1 })
    expect(page.received).toBe(1)
    expect(page.offers).toEqual([])
    expect(await api.offersByIds(['b'.repeat(64)])).toEqual([])
  })

  it('offers by ids keep the order asked and skip removed ones', async () => {
    const { api, data } = setup([
      {
        hash: 'd'.repeat(64),
        type: TX_TYPE.contentDelete,
        time: 1,
        s1: SELLERS.anna,
        s2: 'd'.repeat(64),
      },
    ])
    const [a, b] = [data.offers![2]!.hash, data.offers![0]!.hash]
    const offers = await api.offersByIds([a, 'd'.repeat(64), b])
    expect(offers.map((o) => o.hash)).toEqual([a, b])
  })

  it('my offers include withdrawn ones', async () => {
    const { api } = setup()
    const mine = await api.offersByAddress(ME)
    // Laptop, withdrawn tablet, expired speaker, headphones about to expire.
    expect(mine.map((o) => o.published).sort()).toEqual([
      'published',
      'published',
      'published',
      'withdrawed',
    ])
  })

  it('deals: offers in the categories I want that accept what I have', async () => {
    const { api } = setup()
    // I have a laptop (58068); I want a mountain bike (1006).
    const deals = await api.deals({ theirTags: [1006], myTags: [58068], excludeAddresses: [ME] })
    expect(deals.map((o) => o.caption)).toEqual(['Велосипед горный, рама M'])
  })

  it('offer details: scores, reviews and their authors', async () => {
    const { api, data } = setup()
    const details = await api.offerDetails({ offerIds: [data.offers![0]!.hash] })
    expect(details.scores.map((s) => s.value).sort()).toEqual([4, 5])
    expect(details.reviews[0]!.message).toBe('Всё как в описании, спасибо!')
    expect(details.accounts.map((a) => a.address)).toContain(SELLERS.anna)
  })

  it('accounts and Bastyon profiles by address', async () => {
    const { sdk, api } = setup()
    const [account] = await api.accounts([SELLERS.ilya])
    expect(account).toMatchObject({ address: SELLERS.ilya, rating: 4.9, ratingCount: 41 })
    const [profile] = await api.userProfiles([SELLERS.ilya])
    expect(profile!.name).toBe('Илья Петров')
    const call = sdk.mock.calls.filter((c) => c.method === 'rpc').at(-1)!
    expect(call.args).toEqual(['getuserprofile', [[SELLERS.ilya], '1']])
  })

  it('Brighteon: English only, inside Canada and the USA; nothing when outside', async () => {
    const { sdk } = setup()
    const api = new BarteronApi(sdk, {
      brighteon: true,
      limitLocation: (l) => l.filter((x) => x.startsWith('9')),
    })
    expect(await api.feed({ location: ['u0'] })).toEqual([])
    await api.feed({ location: ['9q'], lang: 'ru-RU' })
    const call = sdk.mock.calls.filter((c) => c.method === 'rpc').at(-1)!
    expect(call.args[1]).toEqual([{ location: ['9q'], lang: 'en-US' }])
  })
})
