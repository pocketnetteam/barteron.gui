/**
 * Exchange matching for my offers (stage 7, s6): direct exchanges and chains
 * of three. The node finds them: `getbarterondeals` and
 * `getbarteroncomplexdeals` (pocketnet.core BarteronRepository). The old app
 * asked the same way on «Найти обмены» (views/Barter/Exchange) and
 * «Групповой обмен» (views/Barter/ThreeSidedSearch).
 */

import type { CategoryTree } from './categories'
import {
  exchangeCategories,
  isForNothing,
  isOfferActive,
  isPickupPoint,
  usesMyList,
  type Offer,
} from './offer'
import { isTxid } from './tx'

/** My offers with the same category and wish list share one pair of node requests. */
export interface MatchGroup {
  myTag: number
  /** What the owner wants: category ids with «my list» resolved, sorted. */
  wish: number[]
}

export const groupKey = (group: MatchGroup): string => `${group.myTag}:${group.wish.join(',')}`

/** Why an offer has nothing to match. */
export type NoMatchReason =
  /** «Что-нибудь»: an empty list. */
  | 'anything'
  /** «Отдам даром». */
  | 'free'
  /** «Мой список», and the profile list is empty. */
  | 'emptyMyList'
  /** A pickup point, or no category: not something to exchange. */
  | 'notExchangeable'

export function noMatchReason(
  offer: Pick<Offer, 'tag' | 'tags'>,
  ownerList: readonly number[]
): NoMatchReason | null {
  if (offer.tag === null || isPickupPoint(offer)) return 'notExchangeable'
  if (isForNothing(offer)) return 'free'
  if (exchangeCategories(offer, ownerList).length) return null
  return usesMyList(offer) ? 'emptyMyList' : 'anything'
}

/** The group an offer is matched in; `null` — see `noMatchReason`. */
export function matchGroupOf(
  offer: Pick<Offer, 'tag' | 'tags'>,
  ownerList: readonly number[]
): MatchGroup | null {
  if (noMatchReason(offer, ownerList) || offer.tag === null) return null
  const wish = [...new Set(exchangeCategories(offer, ownerList))].sort((a, b) => a - b)
  return { myTag: offer.tag, wish }
}

/** Distinct groups of several offers, in the order of the offers. */
export function matchGroups(
  offers: readonly Pick<Offer, 'tag' | 'tags'>[],
  ownerList: readonly number[]
): MatchGroup[] {
  const groups = new Map<string, MatchGroup>()
  for (const offer of offers) {
    const group = matchGroupOf(offer, ownerList)
    if (group && !groups.has(groupKey(group))) groups.set(groupKey(group), group)
  }
  return [...groups.values()]
}

/** What the node answered for one group. */
export interface GroupMatches {
  direct: Offer[]
  /** The node sent a full page: there may be more direct exchanges. */
  more: boolean
  chains: { target: Offer; intermediates: Offer[] }[]
}

/**
 * A chain of three, as the node finds it: my offer goes to the owner of `via`,
 * `via` goes to the owner of `target`, and `target` comes to me.
 */
export interface ExchangeChain {
  source: Offer
  via: Offer
  target: Offer
}

export interface OfferExchanges {
  direct: Offer[]
  chains: ExchangeChain[]
  more: boolean
}

/**
 * Exchanges of one offer from its group's answer: only active offers of other
 * people, each once. A chain needs three different people, and a chain to an
 * offer I can get directly is left out.
 */
export function offerExchanges(source: Offer, raw: GroupMatches, now = Date.now()): OfferExchanges {
  const me = source.address
  const seen = new Set<string>()
  const direct = raw.direct.filter((o) => {
    if (!o.hash || o.address === me || !isOfferActive(o, now) || seen.has(o.hash)) return false
    seen.add(o.hash)
    return true
  })
  const pairs = new Set<string>()
  const chains = raw.chains
    .flatMap(({ target, intermediates }) => intermediates.map((via) => ({ source, via, target })))
    .filter(({ via, target }) => {
      if (!via.hash || !target.hash || seen.has(target.hash)) return false
      if (!isOfferActive(via, now) || !isOfferActive(target, now)) return false
      if (new Set([me, via.address, target.address]).size < 3) return false
      const pair = `${target.hash}:${via.hash}`
      if (pairs.has(pair)) return false
      pairs.add(pair)
      return true
    })
  return { direct, chains, more: raw.more }
}

export const exchangeCount = (x: Pick<OfferExchanges, 'direct' | 'chains'>): number =>
  x.direct.length + x.chains.length

/** The category itself, then its parents, nearest first. */
const lineage = (tree: CategoryTree, tag: number | null): number[] =>
  tag === null
    ? []
    : [
        tag,
        ...tree
          .parents(tag)
          .map((c) => c.id)
          .reverse(),
      ]

/**
 * «Хочет «Ноутбуки» · у вас «Планшеты»»: the category of their list my offer
 * falls under, and the category of my list theirs falls under. `null` when
 * the list is unknown (their «my list» not loaded yet).
 */
export function whyFits(
  tree: CategoryTree,
  source: Pick<Offer, 'tag'>,
  sourceWish: readonly number[],
  target: Pick<Offer, 'tag'>,
  targetWish: readonly number[]
): { theyWant: number | null; youWant: number | null } {
  return {
    theyWant: lineage(tree, source.tag).find((id) => targetWish.includes(id)) ?? null,
    youWant: lineage(tree, target.tag).find((id) => sourceWish.includes(id)) ?? null,
  }
}

// ─── A chain by link ────────────────────────────────────────────────────────

/**
 * `/barter/search?source=…&target=…`, the old link of «Групповой обмен».
 * `via` is new: the old app showed every chain of the source and ignores it.
 */
export interface ChainRef {
  source: string
  target: string
  via: string | null
}

const first = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value)

export function parseChainRef(query: Readonly<Record<string, unknown>>): ChainRef | null {
  const source = first(query.source)
  const target = first(query.target)
  const via = first(query.via)
  if (!isTxid(source) || !isTxid(target) || source === target) return null
  return { source, target, via: isTxid(via) && via !== source && via !== target ? via : null }
}

export const chainRefOf = (chain: ExchangeChain): ChainRef => ({
  source: chain.source.hash ?? '',
  target: chain.target.hash ?? '',
  via: chain.via.hash,
})

export function chainQuery(ref: ChainRef): Record<string, string> {
  return ref.via
    ? { source: ref.source, target: ref.target, via: ref.via }
    : { source: ref.source, target: ref.target }
}

/** What goes into the chat: `sdk.get.applink` of this path, like the old message. */
export const chainPath = (ref: ChainRef): string =>
  `barter/search?${new URLSearchParams(chainQuery(ref)).toString()}`

export type ChainRole = 'source' | 'via' | 'target'

export interface ChainStep {
  role: ChainRole
  offer: Offer
  /** Who gives this offer… */
  giver: string
  /** …and who gets it. */
  receiver: string
}

/** Around the circle: my offer to the owner of `via`, `via` to the owner of `target`, `target` back to me. */
export function chainSteps(chain: ExchangeChain): ChainStep[] {
  const { source, via, target } = chain
  return [
    { role: 'source', offer: source, giver: source.address, receiver: via.address },
    { role: 'via', offer: via, giver: via.address, receiver: target.address },
    { role: 'target', offer: target, giver: target.address, receiver: source.address },
  ]
}

export function viewerRole(
  chain: ExchangeChain,
  viewer: string | null | undefined
): ChainRole | null {
  if (!viewer) return null
  return chainSteps(chain).find((s) => s.giver === viewer)?.role ?? null
}

/** Why a chain from a link no longer works. */
export type ChainProblem = { kind: 'missing' } | { kind: 'inactive'; offer: Offer; role: ChainRole }

export function chainProblem(
  offers: { source?: Offer | null; via?: Offer | null; target?: Offer | null },
  now = Date.now()
): ChainProblem | null {
  const roles: ChainRole[] = ['source', 'via', 'target']
  if (roles.some((role) => !offers[role])) return { kind: 'missing' }
  for (const role of roles) {
    const offer = offers[role]!
    if (!isOfferActive(offer, now)) return { kind: 'inactive', offer, role }
  }
  return null
}

/** «1 150 PKOIN в вашу пользу»: what I give against what I get, in PKOIN. */
export type PriceGap = { kind: 'equal' } | { kind: 'gain' | 'pay'; pkoin: number }

export function priceGap(give: number | null, get: number | null): PriceGap | null {
  if (!give || !get) return null
  const diff = Math.round((give - get) * 100) / 100
  if (Math.abs(diff) < 0.01) return { kind: 'equal' }
  return diff > 0 ? { kind: 'gain', pkoin: diff } : { kind: 'pay', pkoin: -diff }
}
