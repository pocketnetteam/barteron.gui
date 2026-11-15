import { describe, expect, it, vi } from 'vitest'
import { BAN_LIST } from '@/config/ban-list'
import { dealOpReturn, SAFE_DEAL_START_HEIGHT } from '@/models/safe-deal'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork, MOCK_HEIGHT } from '@/sdk/mock-network'
import { demoDeals, demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { BarteronApi, nodeAnswered, searchPattern } from './barteron'

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
  // Newer than every demo offer (mock height 4 000 000).
  height: 4_100_000,
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
    const { api, sdk } = setup()
    expect((await api.feed({ search: searchPattern('гитар') })).map((o) => o.tag)).toEqual([621])
    expect((await api.feed({ tags: [1006] }))[0]!.caption).toMatch(/Велосипед/)
    const all = await api.feed({ pageSize: 100 })
    const cheap = await api.feed({ pageSize: 100, priceMax: 100000 })
    // Some offers in, the dearer ones out: not an empty or unfiltered list.
    expect(cheap.length).toBeGreaterThan(0)
    expect(cheap.length).toBeLessThan(all.length)
    expect(cheap.every((o) => o.priceCents <= 100000)).toBe(true)
    // The price goes to the node as given, in cents.
    expect(sdk.mock.calls.at(-1)?.args).toEqual([
      'getbarteronfeed',
      [{ pageSize: 100, priceMax: 100000 }],
    ])
  })

  it('hides banned authors everywhere, but counts them for paging', async () => {
    const { api } = setup([offerFrom(BANNED, 'b'.repeat(64))])
    const page = await api.feedPage({ pageSize: 1 })
    expect(page.received).toBe(1)
    expect(page.offers).toEqual([])
    expect(await api.offersByIds(['b'.repeat(64)])).toEqual([])
  })

  it('hides banned authors in every list: by author, exchanges, chains, reviews', async () => {
    const { sdk, api } = setup()
    const [A, B] = ['a'.repeat(64), 'b'.repeat(64)]
    const ok = offerFrom(SELLERS.anna, A)
    const bad = offerFrom(BANNED, B)
    const review = (author: string, n: number): RawTx => ({
      hash: String(n).repeat(64),
      type: TX_TYPE.comment,
      time: n,
      s1: author,
      s3: A,
      p: { s1: JSON.stringify({ message: 'Отзыв', info: '5' }) },
    })
    const answers: Record<string, unknown> = {
      getbarteronoffersbyaddress: [bad, ok],
      getbarterondeals: [bad, ok],
      getbarteroncomplexdeals: [
        { target: bad, intermediates: [] },
        { target: ok, intermediates: [bad] },
        { target: ok, intermediates: [ok] },
      ],
      getbarteronoffersdetails: { comments: [review(BANNED, 1), review(SELLERS.anna, 2)] },
      getbarteronoffersbyroottxhashes: [bad, ok],
    }
    vi.spyOn(sdk, 'rpc').mockImplementation(async (method: string) => answers[method] as never)

    const hashes = (offers: { hash: string | null }[]) => offers.map((o) => o.hash)
    expect(hashes(await api.offersByAddress(SELLERS.anna))).toEqual([A])
    expect(hashes((await api.dealsPage({ theirTags: [1006], myTags: [621] })).offers)).toEqual([A])
    const chains = await api.complexDeals({ myTag: 621, theirTags: [1006] })
    expect(chains.map((c) => [c.target.hash, ...hashes(c.intermediates)])).toEqual([[A, A]])
    const details = await api.offerDetails({ offerIds: [A] })
    expect(details.reviews.map((r) => r.address)).toEqual([SELLERS.anna])
    expect(hashes(await api.offersByIds([B, A]))).toEqual([A])
    // Safe deals only: a seller banned in the middle of a deal.
    expect(hashes(await api.offersByIds([B, A], { withBanned: true }))).toEqual([B, A])
  })

  it('every request carries options, even empty: the previous Bastyon fails every request without them', async () => {
    const { sdk, api, data } = setup()
    const options: unknown[] = []
    const real = sdk.rpc.bind(sdk)
    vi.spyOn(sdk, 'rpc').mockImplementation(async (method, parameters, ...rest: unknown[]) => {
      options.push(rest[0])
      return real(method, parameters, rest[0] as Record<string, unknown>)
    })
    const id = data.offers![0]!.hash
    await api.feedPage({ pageSize: 1 })
    await api.groups({ locationGroup: 4 })
    await api.dealsPage({ theirTags: [1006], myTags: [58068] })
    await api.complexDeals({ myTag: 58068, theirTags: [1006] }).catch(() => [])
    await api.offersByAddress(SELLERS.anna)
    await api.offersByIds([id])
    await api.offerDetails({ offerIds: [id] })
    await api.accounts([SELLERS.ilya])
    await api.userProfiles([SELLERS.ilya])
    await api.transfers(SELLERS.anna, ME, dealOpReturn('0'.repeat(26)), 0)
    await api.chainHeight()
    expect(options).toHaveLength(11)
    for (const o of options) expect(o).toEqual({})
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
    const last = () => sdk.mock.calls.filter((c) => c.method === 'rpc').at(-1)!.args
    expect(last()[1]).toEqual([{ location: ['9q'], lang: 'en-US' }])

    // The same for exchanges, chains and counts; outside — not even asked.
    const asked = () => sdk.mock.calls.filter((c) => c.method === 'rpc').length
    const before = asked()
    expect(await api.deals({ theirTags: [1], myTags: [2], location: ['u0'] })).toEqual([])
    expect(await api.complexDeals({ myTag: 2, theirTags: [1], location: ['u0'] })).toEqual([])
    expect(await api.groups({ locationGroup: 4, location: ['u0'] })).toEqual([])
    expect(asked()).toBe(before)
    await api.deals({ theirTags: [1], myTags: [2], location: ['9q'] })
    expect(last()[0]).toBe('getbarterondeals')
    expect(last()[1]).toMatchObject([{ location: ['9q'], lang: 'en-US' }])
    await api.complexDeals({ myTag: 2, theirTags: [1], location: ['9q', 'u0'] })
    expect(last()[0]).toBe('getbarteroncomplexdeals')
    expect(last()[1]).toMatchObject([{ location: ['9q'], lang: 'en-US' }])
    await api.groups({ locationGroup: 4, location: ['9q'] })
    expect(last()[1]).toMatchObject([{ location: ['9q'], lang: 'en-US' }])

    // An offer or a seller by a link: not limited, as in the old app.
    await api.offersByAddress(SELLERS.anna)
    expect(last()[1]).toEqual([SELLERS.anna])
  })

  it('safe deal: transfers by the exact OP_RETURN, as the old page asked', async () => {
    const { sdk, api } = setup()
    const bike = demoDeals(ME).deals[1]!
    const script = dealOpReturn(bike.id)
    const paid = await api.transfers(SELLERS.anna, ME, script, SAFE_DEAL_START_HEIGHT)
    expect(paid.map((t) => t.amount)).toEqual([3978])
    const call = sdk.mock.calls.filter((c) => c.method === 'rpc').at(-1)!
    expect(call.args).toEqual([
      'getfromtotransactions',
      [SELLERS.anna, ME, SAFE_DEAL_START_HEIGHT, script],
    ])
    expect(await api.transfers(SELLERS.anna, ME, dealOpReturn('0'.repeat(26)), 0)).toEqual([])
    expect(await api.chainHeight()).toBe(MOCK_HEIGHT)
  })

  it('safe deal: a transfer lands in the chain with its message in OP_RETURN', async () => {
    const data = demoNetworkData(ME)
    const network = createMockNetwork({ ...data, broadcastMs: 0, confirmMs: 0 })
    const sdk = createMockSdk({ network, granted: ['account', 'payment'] })
    const api = new BarteronApi(sdk)
    const id = '0123456789abcdef7052858601'
    await sdk.payment({
      recievers: [{ address: SELLERS.maria, amount: 1262.5 }],
      feemode: 'exclude',
      message: `Safe deal ${id}`,
    })
    await new Promise((r) => setTimeout(r, 10))
    const [transfer] = await api.transfers(ME, SELLERS.maria, dealOpReturn(id), 0)
    expect(transfer).toMatchObject({ from: ME, to: SELLERS.maria, amount: 1262.5 })
    expect(transfer!.height).toBe(MOCK_HEIGHT + 1)
  })
})

describe('a node error is still an answer («Нет связи с сетью»)', () => {
  // What the hosts really send: pocketnet.gui js/lib/client/api.js and
  // bastyon-nextgen core/bridge-helpers.ts `normalizeError`, helpers/api/reachability.ts.
  it.each([
    ['previous Bastyon: the node refused', { code: -5, error: 'Invalid address' }],
    ['previous Bastyon: bad parameter', { code: -8, message: 'Invalid parameter' }],
    ['bastyon-nextgen: the node refused', { message: 'Invalid address', name: 'Error' }],
    [
      'the node does not know the method',
      Object.assign(new Error('Method not found'), { code: -32601 }),
    ],
  ])('answered: %s', (_, error) => {
    expect(nodeAnswered(error)).toBe(true)
  })

  it.each([
    ['previous Bastyon: no network', 'TypeError: Failed to fetch'],
    ['previous Bastyon: no proxy', 'proxy'],
    ['previous Bastyon: timeout', { code: 408 }],
    ['previous Bastyon: node warming up', { code: -28, error: 'Loading block index' }],
    ['previous Bastyon: proxy failure', { code: 2000 }],
    [
      'bastyon-nextgen: nobody answers',
      { message: 'No Bastyon server answers: rpc', name: 'UnreachableError' },
    ],
    ['bastyon-nextgen: timeout', { message: 'rpc_timeout', name: 'TimeoutError', code: 'timeout' }],
    ['browser: network', new TypeError('Failed to fetch')],
    ['Safari: network', new TypeError('Load failed')],
    ['host bug', new TypeError("Cannot read properties of undefined (reading 'cachetime')")],
    ['nothing', null],
    ['empty error', new Error('')],
    // The same texts when the name got lost on the way (an SDK rebuilding Error).
    ['as Error: nobody answers', { message: 'No Bastyon server answers: rpc', name: 'Error' }],
    ['as Error: Safari network', new Error('Load failed')],
    ['as Error: timeout', new Error('rpc_timeout')],
    ['as Error: no proxy', new Error('proxy')],
  ])('not answered: %s', (_, error) => {
    expect(nodeAnswered(error)).toBe(false)
  })

  it('tells the network banner which is which', async () => {
    const { sdk } = setup()
    const told: boolean[] = []
    const api = new BarteronApi(sdk, { onRpc: (answered) => told.push(answered) })
    const spy = vi.spyOn(sdk, 'rpc')
    spy.mockRejectedValueOnce({ message: 'Invalid address', name: 'Error' })
    await expect(api.accounts(['x'])).rejects.toBeTruthy()
    spy.mockRejectedValueOnce({ message: 'rpc_timeout', name: 'TimeoutError', code: 'timeout' })
    await expect(api.accounts(['x'])).rejects.toBeTruthy()
    spy.mockResolvedValueOnce([])
    await api.accounts(['x'])
    expect(told).toEqual([true, false, true])
  })
})

describe('answers from the node are not trusted', () => {
  const junk: unknown[] = [null, undefined, 'error', 42, {}, [null, 1, 'x', {}, { hash: 5 }]]

  it.each(junk.map((answer) => [JSON.stringify(answer) ?? 'undefined', answer]))(
    'an odd answer (%s) gives empty lists, not a crash',
    async (_, answer) => {
      const { sdk, api } = setup()
      vi.spyOn(sdk, 'rpc').mockResolvedValue(answer as never)
      const id = 'a'.repeat(64)
      expect(await api.feedPage({})).toEqual({ offers: [], received: 0 })
      expect(await api.groups({ locationGroup: 4 })).toEqual([])
      expect(await api.dealsPage({ theirTags: [1], myTags: [2] })).toEqual({
        offers: [],
        received: 0,
      })
      expect(await api.complexDeals({ myTag: 2, theirTags: [1] })).toEqual([])
      expect(await api.offersByAddress(SELLERS.anna)).toEqual([])
      expect(await api.offersByIds([id])).toEqual([])
      expect(await api.offerDetails({ offerIds: [id] })).toEqual({
        scores: [],
        reviews: [],
        commentScores: [],
        accounts: [],
      })
      expect(await api.accounts([SELLERS.anna])).toEqual([])
      expect(await api.userProfiles([SELLERS.anna])).toEqual([])
      await expect(api.chainHeight()).rejects.toThrow('getnodeinfo: no height')
    }
  )

  it('counts in the groups are numbers, never NaN', async () => {
    const { sdk, api } = setup()
    vi.spyOn(sdk, 'rpc').mockResolvedValue([
      { location: 'ucfv', count: '7' },
      { location: 'ucfu', count: 'many' },
      { location: 5, count: 1 },
    ] as never)
    expect(await api.groups({ locationGroup: 4 })).toEqual([
      { location: 'ucfv', count: 7 },
      { location: 'ucfu', count: 0 },
    ])
  })

  it('an id from a link that cannot be an offer is not sent with the others', async () => {
    const { sdk, api, data } = setup()
    const spy = vi.spyOn(sdk, 'rpc')
    const good = data.offers![0]!.hash
    const found = await api.offersByIds(['../etc', good, '', 'z'.repeat(64)])
    expect(found.map((o) => o.hash)).toEqual([good])
    expect(spy.mock.calls.at(-1)!.slice(0, 2)).toEqual([
      'getbarteronoffersbyroottxhashes',
      [[good]],
    ])
    spy.mockClear()
    expect(await api.offersByIds(['not-an-offer'])).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})
