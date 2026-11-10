/**
 * Offer model → what an offer card shows. Screens pass what they know about
 * the viewer: rates and currency, their own exchange list, favourites.
 */

import { toEquivalent, type Rates } from '@/api/rates'
import {
  exchangeCategories,
  fixedCurrencyPrice,
  isForNothing,
  isPriceFrom,
  offerLifecycle,
  offerPkoin,
  usesMyList,
  type Offer,
} from '@/models/offer'
import type { Money, OfferCardData, OfferState } from './types'

export interface CardContext {
  /** Category name by id; `null` while names load or for an unknown id. */
  categoryLabel: (id: number) => string | null
  rates?: Rates | null
  /** Currency the viewer chose. */
  currency?: string
  /** The seller's profile list, for offers that say «my list». */
  sellerList?: readonly number[]
  /** Categories of my own offers: their exchange entries get the match mark. */
  myCategories?: ReadonlySet<number>
  /** The viewer's address: their own offers never get the match mark. */
  viewer?: string | null
  favorite?: boolean
  rating?: number
  /** Photo URL fix-up from the host (`sdk.manageBastyonImageSrc`). */
  imageSrc?: (url: string) => string
  /** «2 часа назад» */
  formatTime?: (ms: number) => string
  /** A transaction for this offer is on its way. */
  pending?: boolean
  now?: number
}

/** Equivalent in the viewer's currency. A currency price in that same currency is shown as set. */
export function offerEquivalent(
  offer: Pick<Offer, 'priceCents' | 'currencyPrice'>,
  currency: string | undefined,
  rates: Rates | null | undefined
): Money | null {
  if (!currency) return null
  const fixed = fixedCurrencyPrice(offer)
  if (fixed && fixed.currency === currency) return { amount: fixed.amount, currency }
  const pkoin = offerPkoin(offer, rates)
  return pkoin === null ? null : toEquivalent(Math.round(pkoin * 100), currency, rates)
}

export function offerCardData(offer: Offer, ctx: CardContext): OfferCardData {
  const id = offer.hash ?? 'draft'
  const lifecycle = offerLifecycle(offer, ctx.now)
  const state: OfferState = ctx.pending
    ? 'pending'
    : lifecycle === 'active' || lifecycle === 'draft'
      ? 'active'
      : 'inactive'
  const own = !!ctx.viewer && offer.address === ctx.viewer
  const categories = exchangeCategories(offer, ctx.sellerList)
  const exchange = categories.flatMap((category) => {
    const label = ctx.categoryLabel(category)
    return label
      ? [
          {
            label,
            category: true,
            to: { name: 'category', params: { id: String(category) } },
            match: !own && (ctx.myCategories?.has(category) ?? false),
          },
        ]
      : []
  })
  const free = isForNothing(offer)
  const photo = offer.images[0]

  return {
    id,
    to: offer.hash ? { name: 'barterItem', params: { id: offer.hash } } : undefined,
    title: offer.caption,
    photo: photo ? (ctx.imageSrc?.(photo) ?? photo) : null,
    photoCount: offer.images.length,
    price: {
      pkoin: free ? null : offerPkoin(offer, ctx.rates),
      free,
      from: isPriceFrom(offer),
      equivalent: free ? null : offerEquivalent(offer, ctx.currency, ctx.rates),
    },
    exchange,
    // An empty list means «anything» (the old app showed «Всё остальное»).
    exchangeAnything: !free && !exchange.length && !(usesMyList(offer) && !ctx.sellerList),
    description: offer.description,
    time: ctx.formatTime?.(offer.time),
    rating: ctx.rating,
    condition: offer.condition === 'used' ? 'used' : 'new',
    safeDeal: !!offer.safeDeal.validatorFeeVariant,
    delivery: !!offer.delivery.deliveryOptions || !!offer.delivery.pickupPoint,
    favorite: ctx.favorite ?? false,
    match: exchange.some((e) => e.match),
    state,
  }
}
