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
  type CatalogFilters,
} from './filters'
import { parseOffer, PKOIN_TOTAL_SUPPLY } from './offer'
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
    expect(parseFilters({ search: '  гитара ' }).search).toBe('гитара')
    expect(filtersQuery({ ...EMPTY_FILTERS, priceMax: 50 })).toEqual({ price: '-50' })
    expect(filtersQuery({ ...EMPTY_FILTERS, priceMin: 50 })).toEqual({ price: '50-' })
    expect(parseFilters({ price: 'abc', exchange: 'x,0,-3,1.5,17,17', condition: 'mint' })).toEqual(
      {
        ...EMPTY_FILTERS,
        exchange: [17],
      }
    )
    expect(filtersQuery(EMPTY_FILTERS)).toEqual({})
  })

  it('a link with huge prices: no more than all PKOIN, so the node gets a whole number', () => {
    const f = parseFilters({ price: '1e30-99999999999999999999' })
    expect(f).toMatchObject({ priceMin: PKOIN_TOTAL_SUPPLY, priceMax: PKOIN_TOTAL_SUPPLY })
    const r = catalogRequest({
      tree: TREE,
      location: [],
      order: { orderBy: 'height', orderDesc: true },
      pageSize: 12,
      category: null,
      filters: f,
    })
    expect(Number.isSafeInteger(r.request.priceMin)).toBe(true)
    expect(JSON.stringify(r.request)).not.toMatch(/e\+/)
    expect(parseFilters({ price: 'Infinity-NaN' })).toMatchObject({
      priceMin: null,
      priceMax: null,
    })
  })

  it('a parameter given twice: the first counts', () => {
    expect(
      parseFilters({
        search: ['гитара', 'велосипед'],
        price: ['10-20', '30-40'],
        free: [null, '1'],
      })
    ).toEqual({ ...EMPTY_FILTERS, search: 'гитара', priceMin: 10, priceMax: 20 })
  })

  it.each<[string, Partial<CatalogFilters>]>([
    ['nothing', {}],
    ['decimal prices', { priceMin: 0.5, priceMax: 1234.56 }],
    ['open range', { priceMax: 50 }],
    ['free with a price kept for later', { free: true, priceMin: 10 }],
    ['delivery in any order', { delivery: ['point', 'pickup'] }],
    ['text with signs', { search: 'C++ & «Ж/д» 100%' }],
    ['everything', { exchange: [38, 17], myList: true, condition: 'new', safeDeal: true }],
  ])('filters → address → filters: %s', (_, part) => {
    const f = { ...EMPTY_FILTERS, ...part }
    const back = parseFilters(filtersQuery(f) as Record<string, string>)
    expect({ ...back, delivery: [...back.delivery].sort() }).toEqual({
      ...f,
      delivery: [...f.delivery].sort(),
    })
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

  it('an exchange category the tree does not know is left out: not a request with no tags', () => {
    const r = catalogRequest({
      ...base,
      category: 1000,
      filters: parseFilters({ exchange: '999999' }),
    })
    expect(r.kind).toBe('feed')
    const mixed = catalogRequest({
      ...base,
      category: 1000,
      filters: parseFilters({ exchange: '999999,17' }),
    })
    expect(mixed.request).toMatchObject({ myTags: [17] })
  })

  it('«only free» drops the price range: the node cannot ask for zero', () => {
    const r = catalogRequest({
      ...base,
      category: null,
      filters: parseFilters({ price: '10-50', free: '1' }),
    })
    expect(r.request).not.toHaveProperty('priceMax')
    expect(r.request).not.toHaveProperty('priceMin')
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
    // A word that starts with the text beats a shallower one that has it inside.
    const inside = { ...names, bikes: 'Мотовелосипеды', city_kids: 'Велосипеды детские' }
    expect(TREE.search('вело', inside).map((c) => c.id)).toEqual([1001, 1003, 1000])
  })

  it('removed categories are not offered: not as roots, not as children, not in search', () => {
    const tree = new CategoryTree([
      [1, null, 1, 'live', [2, 3]],
      [2, 1, 1, 'live_child', []],
      [3, 1, 2, 'gone_child', [], 0, 0, 1],
      [4, null, 2, 'gone_root', [], 0, 0, 1],
    ])
    const names = {
      live: 'Есть',
      live_child: 'Есть тоже',
      gone_child: 'Есть, но удалена',
      gone_root: 'Есть, удалена',
    }
    expect(tree.roots().map((c) => c.id)).toEqual([1])
    expect(tree.children(1).map((c) => c.id)).toEqual([2])
    expect(tree.search('есть', names).map((c) => c.id)).toEqual([1, 2])
    // Old offers may still point there: the name is known.
    expect(tree.label(3, names)).toBe('Есть, но удалена')
  })
})
