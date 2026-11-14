import type { RouteLocationRaw } from 'vue-router'
import { formatDistance } from '@/lib/area'
import { decodeGeohash, distanceKm } from '@/lib/geohash'
import { chainQuery, chainRefOf, type ExchangeChain, type OfferExchanges } from '@/models/exchange'
import type { Offer } from '@/models/offer'

/**
 * «Варианты обмена» of my offer: the old path. `expanded=1` makes the old app
 * show the list at once, if it opens the link.
 */
export const optionsRoute = (id: string): RouteLocationRaw => ({
  name: 'exchangeOptions',
  params: { id },
  query: { expanded: '1' },
})

/** The offer form at its «Обмен» step. */
export const editListRoute = (id: string): RouteLocationRaw => ({
  name: 'createBarter',
  params: { id },
  query: { step: '3' },
})

export const chainRoute = (chain: ExchangeChain): RouteLocationRaw => ({
  name: 'ThreeSidedSearch',
  query: chainQuery(chainRefOf(chain)),
})

export const offerRoute = (id: string): RouteLocationRaw => ({ name: 'barterItem', params: { id } })

export interface FoundExchange {
  key: string
  kind: 'direct' | 'chain'
  /** What I would get. */
  offer: Offer
  to: RouteLocationRaw
  chain?: ExchangeChain
}

/** Direct exchanges first, then chains: what a list of found exchanges shows. */
export function exchangeItems(x: OfferExchanges): FoundExchange[] {
  return [
    ...x.direct.map((offer) => ({
      key: `d:${offer.hash}`,
      kind: 'direct' as const,
      offer,
      to: offerRoute(offer.hash ?? ''),
    })),
    ...x.chains.map((chain) => ({
      key: `c:${chain.target.hash}:${chain.via.hash}`,
      kind: 'chain' as const,
      offer: chain.target,
      to: chainRoute(chain),
      chain,
    })),
  ]
}

/** «3,2 км» between my offer and theirs; `null` without both places. */
export function distanceBetween(
  a: Pick<Offer, 'geohash'>,
  b: Pick<Offer, 'geohash'>,
  locale: string,
  units: { km: string; m: string }
): string | null {
  const from = decodeGeohash(a.geohash)
  const to = decodeGeohash(b.geohash)
  return from && to ? formatDistance(distanceKm(from, to), locale, units) : null
}

export interface ChainPageInput {
  /** The link has a source and a target. */
  link: boolean
  offersPending: boolean
  offersFailed: boolean
  /** The host connection failed: nothing more will come. */
  hostFailed: boolean
  /** The chain from the link no longer works (an offer withdrawn, a want changed). */
  broken: boolean
  found: boolean
  /** The link names the middle offer; an old one does not. */
  via: boolean
  sourceKnown: boolean
  /** The source's chains, looked for when the link has no `via`. */
  matches: 'none' | 'pending' | 'error' | 'ready' | null
}

/** What the chain page shows (`/barter/search`). */
export function chainPage(p: ChainPageInput) {
  if (!p.link) return 'bad' as const
  if (p.offersPending && !p.hostFailed) return 'loading' as const
  if (p.offersFailed) return 'error' as const
  if (p.broken) return 'broken' as const
  if (p.found) return 'ready' as const
  if (!p.via && p.sourceKnown) {
    if (p.matches === 'pending') return 'loading' as const
    // The search failed: retry it, it is not «не найдена».
    if (p.matches === 'error') return 'error' as const
  }
  return 'notFound' as const
}
