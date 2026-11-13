import { describe, expect, it } from 'vitest'
import { CategoryTree } from './categories'
import {
  chainPath,
  chainProblem,
  chainSteps,
  matchGroupOf,
  matchGroups,
  noMatchReason,
  offerExchanges,
  parseChainRef,
  priceGap,
  viewerRole,
  whyFits,
  type GroupMatches,
} from './exchange'
import { emptyOffer, type Offer } from './offer'

const NOW = Date.UTC(2026, 10, 11)
const ME = 'PMe'
const tx = (n: number) => n.toString(16).padStart(64, 'a')

const offer = (n: number, patch: Partial<Offer>): Offer => ({
  ...emptyOffer(ME, 'ru-RU', NOW),
  hash: tx(n),
  txHash: tx(n),
  caption: `Offer ${n}`,
  ...patch,
})

// 1 Электроника → 2 Компьютеры → 3 Ноутбуки; 1 → 4 Планшеты; 5 Спорт → 6 Велосипеды
const tree = new CategoryTree([
  [1, null, 0, 'electronics', [2, 4]],
  [2, 1, 0, 'computers', [3]],
  [3, 2, 0, 'laptops', []],
  [4, 1, 0, 'tablets', []],
  [5, null, 0, 'sport', [6]],
  [6, 5, 0, 'bikes', []],
])

describe('match groups', () => {
  it('offers with the same category and list share a group', () => {
    const a = offer(1, { tag: 3, tags: [6, 4] })
    const b = offer(2, { tag: 3, tags: [4, 6] })
    const c = offer(3, { tag: 3, tags: ['my_list'] })
    expect(matchGroupOf(a, [])).toEqual({ myTag: 3, wish: [4, 6] })
    expect(matchGroups([a, b, c], [6])).toEqual([
      { myTag: 3, wish: [4, 6] },
      { myTag: 3, wish: [6] },
    ])
  })

  it('nothing to match: anything, free, an empty «my list», a pickup point', () => {
    expect(noMatchReason(offer(1, { tag: 3, tags: [] }), [])).toBe('anything')
    expect(noMatchReason(offer(1, { tag: 3, tags: ['for_nothing'] }), [6])).toBe('free')
    expect(noMatchReason(offer(1, { tag: 3, tags: ['my_list'] }), [])).toBe('emptyMyList')
    expect(noMatchReason(offer(1, { tag: 97, tags: [] }), [])).toBe('notExchangeable')
    expect(noMatchReason(offer(1, { tag: 3, tags: ['my_list'] }), [6])).toBeNull()
    expect(matchGroupOf(offer(1, { tag: 3, tags: [] }), [])).toBeNull()
  })
})

describe('exchanges of one offer', () => {
  const source = offer(1, { tag: 3, tags: [6] })
  const bike = offer(10, { address: 'PIlya', tag: 6 })
  const tablet = offer(11, { address: 'POleg', tag: 4 })
  const bike2 = offer(12, { address: 'PMaria', tag: 6 })

  it('only active offers of other people, once each', () => {
    const raw: GroupMatches = {
      direct: [
        bike,
        bike,
        offer(13, { tag: 6 }),
        offer(14, { address: 'PX', published: 'withdrawed' }),
      ],
      more: false,
      chains: [],
    }
    expect(offerExchanges(source, raw, NOW).direct).toEqual([bike])
  })

  it('a chain needs three people and is dropped when the target is a direct exchange', () => {
    const raw: GroupMatches = {
      direct: [bike],
      more: true,
      chains: [
        {
          target: bike2,
          intermediates: [tablet, tablet, offer(15, { address: 'PMaria', tag: 4 })],
        },
        { target: bike, intermediates: [tablet] },
        // The middle offer was withdrawn, or expired: no chain through it.
        {
          target: offer(16, { address: 'PAnna', tag: 6 }),
          intermediates: [
            offer(17, { address: 'PDima', tag: 4, published: 'withdrawed' }),
            offer(18, { address: 'PVera', tag: 4, till: NOW - 1 }),
          ],
        },
      ],
    }
    const result = offerExchanges(source, raw, NOW)
    expect(result.more).toBe(true)
    expect(result.chains).toEqual([{ source, via: tablet, target: bike2 }])
  })

  it('why it fits: the nearest category of each list', () => {
    expect(whyFits(tree, source, [6], bike, [2, 4])).toEqual({ theyWant: 2, youWant: 6 })
    expect(whyFits(tree, source, [5], bike, [1])).toEqual({ theyWant: 1, youWant: 5 })
    expect(whyFits(tree, source, [6], bike, [])).toEqual({ theyWant: null, youWant: 6 })
  })
})

describe('chains by link', () => {
  it('the old link without via, and the new one', () => {
    expect(parseChainRef({ source: tx(1), target: tx(2) })).toEqual({
      source: tx(1),
      target: tx(2),
      via: null,
    })
    expect(parseChainRef({ source: [tx(1)], target: tx(2), via: tx(3) })?.via).toBe(tx(3))
    expect(parseChainRef({ source: tx(1), target: tx(2), via: 'x' })?.via).toBeNull()
    expect(parseChainRef({ source: tx(1) })).toBeNull()
    expect(parseChainRef({ source: tx(1), target: tx(1) })).toBeNull()
    // The middle cannot be one of the ends.
    expect(parseChainRef({ source: tx(1), target: tx(2), via: tx(1) })?.via).toBeNull()
    expect(parseChainRef({ source: tx(1), target: tx(2), via: tx(2) })?.via).toBeNull()
  })

  it('the path for the chat keeps the old parameters first', () => {
    expect(chainPath({ source: tx(1), target: tx(2), via: tx(3) })).toBe(
      `barter/search?source=${tx(1)}&target=${tx(2)}&via=${tx(3)}`
    )
    expect(chainPath({ source: tx(1), target: tx(2), via: null })).toBe(
      `barter/search?source=${tx(1)}&target=${tx(2)}`
    )
  })

  it('who gives what to whom, and who looks', () => {
    const chain = {
      source: offer(1, {}),
      via: offer(2, { address: 'POleg' }),
      target: offer(3, { address: 'PMaria' }),
    }
    expect(chainSteps(chain).map((s) => [s.giver, s.receiver])).toEqual([
      [ME, 'POleg'],
      ['POleg', 'PMaria'],
      ['PMaria', ME],
    ])
    expect(viewerRole(chain, 'PMaria')).toBe('target')
    expect(viewerRole(chain, 'PSomeone')).toBeNull()
    expect(viewerRole(chain, null)).toBeNull()
  })

  it('a withdrawn or missing offer breaks the chain', () => {
    const source = offer(1, {})
    const via = offer(2, { address: 'POleg', published: 'withdrawed' })
    const target = offer(3, { address: 'PMaria' })
    expect(chainProblem({ source, via, target }, NOW)).toEqual({
      kind: 'inactive',
      offer: via,
      role: 'via',
    })
    expect(chainProblem({ source, via: null, target }, NOW)).toEqual({ kind: 'missing' })
    const expired = { ...target, till: NOW - 1 }
    expect(
      chainProblem({ source, via: { ...via, published: 'published' }, target: expired }, NOW)
    ).toEqual({
      kind: 'inactive',
      offer: expired,
      role: 'target',
    })
    expect(
      chainProblem({ source, via: { ...via, published: 'published' }, target }, NOW)
    ).toBeNull()
  })
})

describe('price gap', () => {
  it('in my favour, a top-up, equal, unknown', () => {
    expect(priceGap(2400, 1250)).toEqual({ kind: 'gain', pkoin: 1150 })
    expect(priceGap(10, 12.5)).toEqual({ kind: 'pay', pkoin: 2.5 })
    expect(priceGap(5, 5)).toEqual({ kind: 'equal' })
    expect(priceGap(null, 5)).toBeNull()
    expect(priceGap(0, 5)).toBeNull()
  })
})
