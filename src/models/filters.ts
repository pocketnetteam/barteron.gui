/**
 * Catalog filters. They live in the page address, so a filtered list can be
 * shared and survives a reload. `search` keeps the old app's name: links like
 * `/category/search?search=…` are already in chats.
 *
 * The node filters by category, price, place and text (`getbarteronfeed`), and
 * by what an offer accepts in exchange (`getbarterondeals`). Free offers,
 * condition, delivery and safe deal are new and filtered here, on the pages
 * already loaded: the node knows nothing about them.
 */

import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { DealsRequest, FeedRequest } from '@/api/barteron'
import type { CategoryTree } from './categories'
import { isForNothing, PKOIN_TOTAL_SUPPLY, toPriceCents, type Offer } from './offer'
import type { JsonObject } from './tx'

export type Condition = 'new' | 'used'
/** Самовывоз · Почтой, курьером · Пункт выдачи — the old `deliveryOptions` keys. */
export type DeliveryWay = 'pickup' | 'courier' | 'point'
export const DELIVERY_WAYS: readonly DeliveryWay[] = ['pickup', 'courier', 'point']

export interface CatalogFilters {
  search: string
  /** PKOIN, not hundredths. */
  priceMin: number | null
  priceMax: number | null
  free: boolean
  /** Categories the offer accepts in exchange. */
  exchange: number[]
  /** …plus the categories of my profile list («То, что есть в моём списке»). */
  myList: boolean
  condition: Condition | null
  delivery: DeliveryWay[]
  safeDeal: boolean
}

export const EMPTY_FILTERS: CatalogFilters = {
  search: '',
  priceMin: null,
  priceMax: null,
  free: false,
  exchange: [],
  myList: false,
  condition: null,
  delivery: [],
  safeDeal: false,
}

/** Price chips of the mockups: до 50 · 50–100 · 100–500 · 500–1000 · от 1000. */
export const PRICE_PRESETS: readonly (readonly [number | null, number | null])[] = [
  [null, 50],
  [50, 100],
  [100, 500],
  [500, 1000],
  [1000, null],
]

/** «Часто выбирают» in «Принимают в обмен»: the old favourites (PKOIN, gold, silver, paper money). */
export const FREQUENT_EXCHANGE = [17, 38, 13, 11116] as const

const first = (value: LocationQuery[string] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? ''

/**
 * A price from the address, at most all PKOIN there are: a bigger one from a
 * crafted link would reach the node as «1e+22», which it refuses (audit, finding 74).
 */
const positive = (text: string): number | null => {
  const n = Number(text)
  return text !== '' && Number.isFinite(n) && n > 0 ? Math.min(n, PKOIN_TOTAL_SUPPLY) : null
}

const ids = (text: string): number[] => [
  ...new Set(
    text
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
  ),
]

export function parseFilters(query: LocationQuery): CatalogFilters {
  const [min = '', max = ''] = first(query.price).split('-')
  let priceMin = positive(min)
  let priceMax = positive(max)
  if (priceMin !== null && priceMax !== null && priceMin > priceMax)
    [priceMin, priceMax] = [priceMax, priceMin]
  const condition = first(query.condition)
  return {
    search: first(query.search).trim(),
    priceMin,
    priceMax,
    free: first(query.free) === '1',
    exchange: ids(first(query.exchange)),
    myList: first(query.mylist) === '1',
    condition: condition === 'new' || condition === 'used' ? condition : null,
    delivery: DELIVERY_WAYS.filter((w) => first(query.delivery).split(',').includes(w)),
    safeDeal: first(query.safedeal) === '1',
  }
}

/** Only what differs from the defaults goes to the address. */
export function filtersQuery(f: CatalogFilters): LocationQueryRaw {
  const q: LocationQueryRaw = {}
  if (f.search) q.search = f.search
  if (f.priceMin !== null || f.priceMax !== null)
    q.price = `${f.priceMin ?? ''}-${f.priceMax ?? ''}`
  if (f.free) q.free = '1'
  if (f.exchange.length) q.exchange = f.exchange.join(',')
  if (f.myList) q.mylist = '1'
  if (f.condition) q.condition = f.condition
  if (f.delivery.length) q.delivery = f.delivery.join(',')
  if (f.safeDeal) q.safedeal = '1'
  return q
}

export type FilterChip =
  | { key: 'price'; min: number | null; max: number | null }
  | { key: 'free' }
  | { key: 'exchange'; id: number }
  | { key: 'myList' }
  | { key: 'condition'; value: Condition }
  | { key: 'delivery'; value: DeliveryWay }
  | { key: 'safeDeal' }

/** Applied filters as chips over the list. Search is not one: it has its own field. */
export function filterChips(f: CatalogFilters): FilterChip[] {
  const chips: FilterChip[] = []
  if (f.free) chips.push({ key: 'free' })
  else if (f.priceMin !== null || f.priceMax !== null)
    chips.push({ key: 'price', min: f.priceMin, max: f.priceMax })
  for (const id of f.exchange) chips.push({ key: 'exchange', id })
  if (f.myList) chips.push({ key: 'myList' })
  if (f.condition) chips.push({ key: 'condition', value: f.condition })
  for (const value of f.delivery) chips.push({ key: 'delivery', value })
  if (f.safeDeal) chips.push({ key: 'safeDeal' })
  return chips
}

export function withoutChip(f: CatalogFilters, chip: FilterChip): CatalogFilters {
  switch (chip.key) {
    case 'price':
      return { ...f, priceMin: null, priceMax: null }
    case 'free':
      return { ...f, free: false }
    case 'exchange':
      return { ...f, exchange: f.exchange.filter((id) => id !== chip.id) }
    case 'myList':
      return { ...f, myList: false }
    case 'condition':
      return { ...f, condition: null }
    case 'delivery':
      return { ...f, delivery: f.delivery.filter((w) => w !== chip.value) }
    case 'safeDeal':
      return { ...f, safeDeal: false }
  }
}

/** Filters left after «Сбросить всё»: the search stays. */
export const resetFilters = (f: CatalogFilters): CatalogFilters => ({
  ...EMPTY_FILTERS,
  search: f.search,
})

export const activeFilterCount = (f: CatalogFilters): number => filterChips(f).length

/** Filters the node cannot apply. */
export const hasLocalFilters = (f: CatalogFilters): boolean =>
  f.free || !!f.condition || f.delivery.length > 0 || f.safeDeal

const enabled = (options: unknown, key: string): boolean => {
  const value = (options as JsonObject | undefined)?.[key] as JsonObject | undefined
  return value?.isEnabled === true
}

export function deliveryWays(offer: Pick<Offer, 'delivery'>): DeliveryWay[] {
  const options = offer.delivery.deliveryOptions
  const ways: DeliveryWay[] = []
  if (enabled(options, 'selfPickup')) ways.push('pickup')
  if (enabled(options, 'directDelivery')) ways.push('courier')
  if (enabled(options, 'pickupPoints')) ways.push('point')
  return ways
}

/** The new filters, applied to an offer the node returned. */
export function matchesLocalFilters(offer: Offer, f: CatalogFilters): boolean {
  if (f.free && !isForNothing(offer)) return false
  if (f.condition && offer.condition !== f.condition) return false
  if (f.delivery.length && !deliveryWays(offer).some((w) => f.delivery.includes(w))) return false
  if (f.safeDeal && !offer.safeDeal.validatorFeeVariant) return false
  return true
}

export interface CatalogRequestInput {
  /** The category of the page; `null` — all categories (search). */
  category: number | null
  filters: CatalogFilters
  tree: CategoryTree
  /** Geohash prefixes of the place filter; empty — everywhere. */
  location: readonly string[]
  order: { orderBy: 'height' | 'price'; orderDesc: boolean }
  pageSize: number
  /** My profile list, for «То, что есть в моём списке». */
  myListTags?: readonly number[]
}

export type CatalogRequest =
  { kind: 'feed'; request: FeedRequest } | { kind: 'deals'; request: DealsRequest }

const expand = (tree: CategoryTree, roots: readonly number[]): number[] => [
  ...new Set(roots.flatMap((id) => tree.withDescendants(id))),
]

/**
 * One request for the node, like the old offer store built it: a category
 * becomes itself plus all its subcategories; an exchange filter turns the feed
 * into `getbarterondeals` (their tags — the page category, my tags — what the
 * offer should accept).
 */
export function catalogRequest(input: CatalogRequestInput): CatalogRequest {
  const { filters: f, tree } = input
  const tags = input.category === null ? [] : expand(tree, [input.category])
  // A category the tree does not know (an old or crafted link) is left out:
  // alone it would turn the list into exchanges for nothing at all.
  const exchangeRoots = [...f.exchange, ...(f.myList ? (input.myListTags ?? []) : [])].filter(
    (id) => !!tree.get(id)
  )
  const common = {
    location: [...input.location],
    ...(f.search && { search: `%${f.search}%` }),
    ...(!f.free && f.priceMin !== null && { priceMin: toPriceCents(f.priceMin) }),
    ...(!f.free && f.priceMax !== null && { priceMax: toPriceCents(f.priceMax) }),
    orderBy: input.order.orderBy,
    orderDesc: input.order.orderDesc,
    pageSize: input.pageSize,
  }
  if (exchangeRoots.length) {
    return {
      kind: 'deals',
      request: { ...common, theirTags: tags, myTags: expand(tree, exchangeRoots) },
    }
  }
  return { kind: 'feed', request: { ...common, tags } }
}
