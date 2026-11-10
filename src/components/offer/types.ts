import type { RouteLocationRaw } from 'vue-router'

/** An amount in a fiat currency: the equivalent next to a PKOIN price. */
export interface Money {
  amount: number
  /** ISO code: RUB, USD, EUR, RSD… */
  currency: string
}

export interface OfferPrice {
  /** PKOIN amount; ignored when `free`. */
  pkoin?: number | null
  free?: boolean
  /** «от 3 100 PKOIN» */
  from?: boolean
  /** Null when there is no rate: only PKOIN is shown (principle 04). */
  equivalent?: Money | null
}

/** One entry of «Меняю на». */
export interface ExchangeItem {
  label: string
  to?: RouteLocationRaw
  /** A category (violet tag); free text without a category is grey. */
  category?: boolean
  /** Matches one of my offers (check mark). */
  match?: boolean
}

export type OfferState = 'active' | 'pending' | 'inactive'

/**
 * What an offer card shows. Stage 2 maps the offer model (tx 211) to it;
 * here the shape only follows the mockups.
 */
export interface OfferCardData {
  id: string
  to?: RouteLocationRaw
  title: string
  photo?: string | null
  /** Number of photos, for the dots on the photo. */
  photoCount?: number
  price: OfferPrice
  exchange?: ExchangeItem[]
  /** «Меняю на: что-нибудь» */
  exchangeAnything?: boolean
  description?: string
  /** «Таганская» / «Москва, Таганская · 3,2 км» */
  place?: string
  /** «2 часа назад» — formatted by the caller. */
  time?: string
  /** Seller rating, shown on the photo. */
  rating?: number
  condition?: 'new' | 'used'
  /** «0:42» — the offer has a video. */
  videoDuration?: string
  safeDeal?: boolean
  delivery?: boolean
  favorite?: boolean
  /** Fits one of my offers for an exchange. */
  match?: boolean
  state?: OfferState
  /** Pending: «Ждём подтверждения · ~1 мин». Inactive: «Снято 12 октября». */
  stateNote?: string
  /** Inactive: the label on the photo, «Срок публикации истёк». */
  stateLabel?: string
}
