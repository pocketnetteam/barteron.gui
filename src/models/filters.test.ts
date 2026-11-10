import { describe, expect, it } from 'vitest'
import { CategoryTree, type CategoryTuple } from './categories'
import {
  activeFilterCount,
  catalogRequest,
  deliveryWays,
  EMPTY_FILTERS,
  filterChips,
  filtersQuery,
  matchesLocalFilters,
  parseFilters,
  resetFilters,
  withoutChip,
} from './filters'
import { parseOffer } from './offer'
import { TX_TYPE } from './tx'

const TREE = new CategoryTree([
  [1000, null, 1, 'bikes', [1001, 1002]],
  [1001, 1000, 1, 'mountain', []],
  [1002, 1000, 2, 'city', [1003]],
  [1003, 1002, 1, 'city_kids', []],
  [17, null, 2, 'pkoin', []],
  [12, null, 3, 'gold', [38]],
  [38, 12, 1, 'gold_coins', []],
] as CategoryTuple[])

const offer = (json: object, price = 0) =>
  parseOffer({
    hash: 'a'.repeat(64),
    type: TX_TYPE.offer,
    s1: 'PAuthor',
    s2: 'a'.repeat(64),
    time: 1_700_000_000,
    p: { s1: 'ru-RU', s2: 'Велосипед', s3: '', s4: JSON.stringify(json), i1: price },
  })

describe('catalog filters in the address', () => {
  it('reads and writes the same query', () => {
    const query = {
      search: 'велосипед',
      price: '100-500',
      exchange: '17,38',
      mylist: '1',
      condition: 'used',
      delivery: 'pickup,point',
      safedeal: '1',
    }
    const f = parseFilters(query)
    expect(f).toEqual({
      search: 'велосипед',
      priceMin: 100,
      priceMax: 500,
      free: false,
      exchange: [17, 38],
      myList: true,
      condition: 'used',
      delivery: ['pickup', 'point'],
      safeDeal: true,
    })
    expect(filtersQuery(f)).toEqual(query)
  })

  it('open price ranges, swapped bounds and junk', () => {
    expect(parseFilters({ price: '-50' })).toMatchObject({ priceMin: null, priceMax: 50 })
    expect(parseFilters({ price: '1000-' })).toMatchObject({ priceMin: 1000, priceMax: null })
    expect(parseFilters({ price: '500-100' })).toMatchObject({ priceMin: 100, priceMax: 500 })
    expect(parseFilters({ price: 'abc', exchange: 'x,0,-3,17,17', condition: 'mint' })).toEqual({
      ...EMPTY_FILTERS,
      exchange: [17],
    })
    expect(filtersQuery(EMPTY_FILTERS)).toEqual({})
  })

  it('chips: free replaces the price; removing a chip keeps the rest; reset keeps search', () => {
    const f = parseFilters({
      search: 'x',
      price: '-50',
      free: '1',
      exchange: '17',
      delivery: 'courier',
    })
    const chips = filterChips(f)
    expect(chips.map((c) => c.key)).toEqual(['free', 'exchange', 'delivery'])
    expect(activeFilterCount(f)).toBe(3)
    expect(withoutChip(f, { key: 'exchange', id: 17 }).exchange).toEqual([])
    expect(withoutChip(f, { key: 'free' })).toMatchObject({ free: false, priceMax: 50 })
    expect(resetFilters(f)).toEqual({ ...EMPTY_FILTERS, search: 'x' })
  })
})

describe('catalog request for the node', () => {
  const base = {
    tree: TREE,
    location: ['ucfv'],
    order: { orderBy: 'height' as const, orderDesc: true },
    pageSize: 12,
  }

  it('a category becomes itself with all subcategories; price goes in hundredths', () => {
    const r = catalogRequest({
      ...base,
      category: 1000,
      filters: parseFilters({ search: 'stels', price: '100.5-500' }),
    })
    expect(r).toEqual({
      kind: 'feed',
      request: {
        tags: [1000, 1001, 1002, 1003],
        location: ['ucfv'],
        search: '%stels%',
        priceMin: 10050,
        priceMax: 50000,
        orderBy: 'height',
        orderDesc: true,
        pageSize: 12,
      },
    })
  })

  it('search in all categories sends no tags', () => {
    const r = catalogRequest({ ...base, category: null, filters: parseFilters({ search: 'x' }) })
    expect(r.kind === 'feed' && r.request.tags).toEqual([])
  })

  it('an exchange filter asks getbarterondeals: my tags expanded, my list added', () => {
    const r = catalogRequest({
      ...base,
      category: 1002,
      filters: parseFilters({ exchange: '12', mylist: '1' }),
      myListTags: [17],
    })
    expect(r.kind).toBe('deals')
    expect(r.request).toMatchObject({ theirTags: [1002, 1003], myTags: [12, 38, 17] })
  })

  it('«only free» drops the price range: the node cannot ask for zero', () => {
    const r = catalogRequest({
      ...base,
      category: null,
      filters: parseFilters({ price: '-50', free: '1' }),
    })
    expect(r.request).not.toHaveProperty('priceMax')
  })
})

describe('filters the node does not know', () => {
  it('delivery ways come from the old deliveryOptions keys', () => {
    const o = offer({
      t: 1001,
      d: {
        deliveryOptions: { selfPickup: { isEnabled: true }, pickupPoints: { isEnabled: false } },
      },
    })
    expect(deliveryWays(o)).toEqual(['pickup'])
    expect(matchesLocalFilters(o, { ...EMPTY_FILTERS, delivery: ['pickup', 'courier'] })).toBe(true)
    expect(matchesLocalFilters(o, { ...EMPTY_FILTERS, delivery: ['point'] })).toBe(false)
  })

  it('free, condition and safe deal', () => {
    const free = offer({ t: 1001, a: ['for_nothing'], c: 'used' })
    const paid = offer({ t: 1001, a: [17], c: 'new', s: { validatorFeeVariant: 'buyer' } }, 10000)
    expect(matchesLocalFilters(free, { ...EMPTY_FILTERS, free: true })).toBe(true)
    expect(matchesLocalFilters(paid, { ...EMPTY_FILTERS, free: true })).toBe(false)
    expect(matchesLocalFilters(free, { ...EMPTY_FILTERS, condition: 'used' })).toBe(true)
    expect(matchesLocalFilters(paid, { ...EMPTY_FILTERS, condition: 'used' })).toBe(false)
    expect(matchesLocalFilters(paid, { ...EMPTY_FILTERS, safeDeal: true })).toBe(true)
    expect(matchesLocalFilters(free, { ...EMPTY_FILTERS, safeDeal: true })).toBe(false)
  })
})

describe('category search', () => {
  it('names that start with the text come first, then shallow ones', () => {
    const names = {
      bikes: 'Велосипеды',
      mountain: 'Горные велосипеды',
      city: 'Городские',
      city_kids: 'Детские велосипеды',
      pkoin: 'Покеткоины',
      gold: 'Золото',
      gold_coins: 'Золотые монеты',
    }
    expect(TREE.search('велос', names).map((c) => c.id)).toEqual([1000, 1001, 1003])
    expect(TREE.search('  ', names)).toEqual([])
  })
})
