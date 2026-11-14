import { describe, expect, it } from 'vitest'
import { emptyOffer, type Offer } from '@/models/offer'
import { chainPage, exchangeItems, type ChainPageInput } from './exchange-ui'

const offer = (n: number, address: string): Offer => ({
  ...emptyOffer(address, 'ru-RU', 0),
  hash: n.toString(16).padStart(64, 'a'),
})

describe('found exchanges as a list', () => {
  it('direct first; two chains to one offer through different people are two rows', () => {
    const source = offer(1, 'PMe')
    const target = offer(2, 'PAnna')
    const items = exchangeItems({
      direct: [offer(3, 'PIlya')],
      chains: [
        { source, via: offer(4, 'PMaria'), target },
        { source, via: offer(5, 'PDima'), target },
      ],
      more: false,
    })
    expect(items.map((i) => i.kind)).toEqual(['direct', 'chain', 'chain'])
    expect(new Set(items.map((i) => i.key)).size).toBe(3)
    expect(items[1]!.to).toMatchObject({
      name: 'ThreeSidedSearch',
      query: { via: offer(4, 'x').hash },
    })
  })
})

describe('the chain page', () => {
  const base: ChainPageInput = {
    link: true,
    offersPending: false,
    offersFailed: false,
    hostFailed: false,
    broken: false,
    found: false,
    via: false,
    sourceKnown: true,
    matches: 'ready',
  }

  it('an old link without via: «ищем» while chains are looked for, then the chain or «не найдена»', () => {
    expect(chainPage({ ...base, matches: 'pending' })).toBe('loading')
    expect(chainPage({ ...base, found: true })).toBe('ready')
    expect(chainPage(base)).toBe('notFound')
  })

  it('the search for chains failing is an error to retry, not «цепочка не найдена»', () => {
    expect(chainPage({ ...base, matches: 'error' })).toBe('error')
  })

  it('a link with via: its three offers decide; a broken chain says so', () => {
    expect(chainPage({ ...base, via: true, matches: null, found: true })).toBe('ready')
    expect(chainPage({ ...base, via: true, matches: null, broken: true })).toBe('broken')
    expect(chainPage({ ...base, via: true, matches: 'error' })).toBe('notFound')
  })

  it('no link, offers loading or failing', () => {
    expect(chainPage({ ...base, link: false })).toBe('bad')
    expect(chainPage({ ...base, offersPending: true })).toBe('loading')
    // The host gave up: no endless skeleton.
    expect(chainPage({ ...base, offersPending: true, hostFailed: true })).toBe('notFound')
    expect(chainPage({ ...base, offersFailed: true })).toBe('error')
  })
})
