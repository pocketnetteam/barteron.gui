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
