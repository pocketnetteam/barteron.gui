/**
 * Barteron offer: transaction `brtoffer`, type 211.
 *
 * Read side follows the old model (barteron.gui `src/js/models/offer.js`);
 * the payload for `sdk.barteron.offer` holds exactly the fields the host
 * serialises (pocketnet.gui `js/kit.js` brtOffer, bastyon-nextgen
 * `src/mini-apps/tx/legacy-objects.ts`). The two versions of the app edit the
 * same offers, so field names and the JSON in `p.s4` stay as they are; new
 * fields may only be added.
 *
 * Chain layout:
 * - `s1` — author address; `s2` — txid of the first version (the offer id);
 * - `p.s1` language, `p.s2` caption, `p.s3` description;
 * - `p.s4` JSON `{t, a, c, p, f, d, v, s, m}` — category, exchange list,
 *   condition, publication state, price in a currency, delivery, video
 *   settings, safe deal, metadata;
 * - `p.s5` JSON array of photo URLs; `p.s6` geohash; `p.s7` video URL;
 * - `p.i1` price in hundredths of PKOIN.
 */

import {
  isJsonObject,
  isTxid,
  objectOr,
  parseJson,
  parseJsonObject,
  str,
  txTimeMs,
  type JsonObject,
  type RawTx,
} from './tx'

/** Exchange list entry: a category id, or one of the two special values. */
export type ExchangeTag = number | 'my_list' | 'for_nothing'

/** «Меняю на» — the list from my Barteron profile. */
export const MY_LIST = 'my_list'
/** «Отдам даром». */
export const FOR_NOTHING = 'for_nothing'

/** `withdrawed` (sic) is what the old app writes; keep the spelling. */
export type OfferPublication = 'published' | 'withdrawed' | 'removed'

/**
 * A price the seller set in a currency. The PKOIN price then follows the rate
 * at viewing time (old `pkoinPrice`); `p.i1` holds the PKOIN price at publishing.
 */
export interface OfferCurrencyPrice extends JsonObject {
  /** ISO code. */
  currency?: string
  /** Price in that currency: a number, or a string like `"45068.00"` in older offers. */
  price?: number | string
  /** The seller turned the currency price off. */
  isDisabled?: boolean
}

export interface OfferDelivery extends JsonObject {
  pickupPoint?: unknown
  deliveryOptions?: unknown
}

export interface OfferVideoSettings extends JsonObject {
  /** Where the video goes among the photos: `first` or `last`. */
  order?: string
}

export interface OfferSafeDeal extends JsonObject {
  validator?: string
  validatorFeeVariant?: string
}

export interface Offer {
  /** Offer id: txid of the first version. `null` — a draft. */
  hash: string | null
  /** txid of the version read from the node. */
  txHash: string | null
  address: string
  /** Locale like `ru-RU`. */
  language: string
  caption: string
  description: string
  /** Category id. */
  tag: number | null
  /** «Меняю на»: category ids, `my_list` or `for_nothing`. */
  tags: ExchangeTag[]
  /** `new` or `used`. */
  condition: string
  images: string[]
  delivery: OfferDelivery
  videoSettings: OfferVideoSettings
  safeDeal: OfferSafeDeal
  metaData: JsonObject
  geohash: string
  video: string
  currencyPrice: OfferCurrencyPrice
  /** Hundredths of PKOIN, exactly as on chain. */
  priceCents: number
  published: OfferPublication
  /** When this version was written, ms. */
  time: number
  /** `null` — still in the mempool. */
  height: number | null
  /** Expires a year after `time`, ms. */
  till: number
}

/** Category of pickup points. */
export const PICKUP_POINT_CATEGORY = 97

const ONE_YEAR = (time: number): number => {
  const date = new Date(time)
  return date.setFullYear(date.getFullYear() + 1)
}

const toTag = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}

/** Numeric strings become numbers, like `tags.map(tag => !isNaN(+tag) ? +tag : tag)` in the old model. */
const toExchangeTags = (value: unknown): ExchangeTag[] =>
  Array.isArray(value)
    ? value.flatMap((tag): ExchangeTag[] => {
        const id = toTag(tag)
        if (id !== null) return [id]
        return tag === MY_LIST || tag === FOR_NOTHING ? [tag] : []
      })
    : []

const toPublication = (value: unknown): OfferPublication =>
  value === 'withdrawed' || value === 'removed' ? value : 'published'

/** Reads an offer from a node transaction. */
export function parseOffer(tx: RawTx, now = Date.now()): Offer {
  const p = tx.p ?? {}
  const json = parseJsonObject(p.s4)
  const images = parseJson(p.s5)
  const time = txTimeMs(tx.time, now)

  return {
    hash: tx.s2 || tx.hash || null,
    txHash: tx.hash || null,
    address: str(tx.s1),
    language: str(p.s1),
    caption: str(p.s2),
    description: str(p.s3),
    tag: toTag(json.t),
    tags: toExchangeTags(json.a),
    condition: str(json.c, 'new') || 'new',
    images: Array.isArray(images)
      ? images.filter((i): i is string => typeof i === 'string' && !!i)
      : [],
    delivery: objectOr(json.d, {}),
    videoSettings: objectOr(json.v, {}),
    safeDeal: objectOr(json.s, {}),
    metaData: objectOr(json.m, {}),
    geohash: str(p.s6),
    video: str(p.s7),
    currencyPrice: objectOr(json.f, {}),
    priceCents: typeof p.i1 === 'number' && Number.isFinite(p.i1) ? p.i1 : 0,
    published: toPublication(json.p),
    time,
    height: typeof tx.height === 'number' ? tx.height : null,
    till: ONE_YEAR(time),
  }
}

/** A new offer before it is published. */
export function emptyOffer(address: string, language: string, now = Date.now()): Offer {
  return {
    hash: null,
    txHash: null,
    address,
    language,
    caption: '',
    description: '',
    tag: null,
    tags: [],
    condition: 'new',
    images: [],
    delivery: {},
    videoSettings: {},
    safeDeal: {},
    metaData: {},
    geohash: '',
    video: '',
    currencyPrice: {},
    priceCents: 0,
    published: 'published',
    time: now,
    height: null,
    till: ONE_YEAR(now),
  }
}

/** No price above this is real: show «цена больше, чем всего PKOIN» (old `pkoinTotalSupply`). */
export const PKOIN_TOTAL_SUPPLY = 24_375_000

/** The fixed currency price, when the seller set one. */
export function fixedCurrencyPrice(
  offer: Pick<Offer, 'currencyPrice'>
): { currency: string; amount: number } | null {
  const { currency, price, isDisabled } = offer.currencyPrice
  if (isDisabled || typeof currency !== 'string' || !currency) return null
  if (price === undefined || price === null || price === '') return null
  const amount = Number(price)
  return Number.isFinite(amount) && amount >= 0
    ? { currency: currency.toUpperCase(), amount }
    : null
}

/**
 * PKOIN price to show. With a currency price it follows today's rate, and
 * without the rate it is unknown (`null`); otherwise it is the price on chain.
 */
export function offerPkoin(
  offer: Pick<Offer, 'priceCents' | 'currencyPrice'>,
  rates?: Readonly<Record<string, number>> | null
): number | null {
  const fixed = fixedCurrencyPrice(offer)
  if (!fixed) return offer.priceCents / 100
  const rate = rates?.[fixed.currency]
  return rate ? fixed.amount / rate : null
}

/** «от 3 100 PKOIN»: pickup points, or the seller chose «от». */
export const isPriceFrom = (offer: Pick<Offer, 'tag' | 'metaData'>): boolean => {
  const price = offer.metaData.price
  return isPickupPoint(offer) || (isJsonObject(price) && price.prefix === 'from')
}

/** PKOIN typed by a person → hundredths. `Math.round`: the old `parseInt(x * 100)` turned 0.29 into 28. */
export const toPriceCents = (pkoin: number): number => Math.round(pkoin * 100)

export const isPickupPoint = (offer: Pick<Offer, 'tag'>): boolean =>
  offer.tag === PICKUP_POINT_CATEGORY

export const isForNothing = (offer: Pick<Offer, 'tags'>): boolean =>
  offer.tags.includes(FOR_NOTHING)

export const usesMyList = (offer: Pick<Offer, 'tags'>): boolean => offer.tags.includes(MY_LIST)

/** Category ids the seller wants; `my_list` resolves to the seller's profile list. */
export function exchangeCategories(
  offer: Pick<Offer, 'tags'>,
  sellerList: readonly number[] = []
): number[] {
  if (isForNothing(offer)) return []
  if (usesMyList(offer)) return [...sellerList]
  return offer.tags.filter((t): t is number => typeof t === 'number')
}

/**
 * - `draft` — not published yet;
 * - `removed` — deleted by the author (`published: removed`);
 * - `withdrawn` — taken off by the author;
 * - `expired` — a year has passed;
 * - `active` — visible to everyone.
 */
export type OfferLifecycle = 'draft' | 'removed' | 'withdrawn' | 'expired' | 'active'

export function offerLifecycle(
  offer: Pick<Offer, 'hash' | 'published' | 'till'>,
  now = Date.now()
): OfferLifecycle {
  if (!offer.hash) return 'draft'
  if (offer.published === 'removed') return 'removed'
  if (offer.published === 'withdrawed') return 'withdrawn'
  if (offer.till < now) return 'expired'
  return 'active'
}

export const isOfferActive = (
  offer: Pick<Offer, 'hash' | 'published' | 'till'>,
  now = Date.now()
): boolean => offerLifecycle(offer, now) === 'active'

/** What `sdk.barteron.offer` receives. The host builds and signs the transaction from it. */
export interface OfferPayload {
  address: string
  /** First version's txid when editing, `null` for a new offer. */
  hash: string | null
  language: string
  caption: string
  description: string
  tag: number
  tags: ExchangeTag[]
  condition: string
  images: string[]
  geohash: string
  video: string
  currencyPrice: OfferCurrencyPrice
  delivery: OfferDelivery
  videoSettings: OfferVideoSettings
  safeDeal: OfferSafeDeal
  metaData: JsonObject
  /** Hundredths of PKOIN. */
  price: number
  published: OfferPublication
}

/** Why an offer cannot be sent; the field name, like the host's `brtoffer:invalid:<field>`. */
export type OfferInvalidField =
  | 'address'
  | 'language'
  | 'caption'
  | 'description'
  | 'tag'
  | 'tags'
  | 'condition'
  | 'images'
  | 'geohash'
  | 'price'
  | 'video'

export class OfferInvalidError extends Error {
  constructor(readonly field: OfferInvalidField) {
    super(`offer:invalid:${field}`)
    this.name = 'OfferInvalidError'
  }
}

export interface OfferCheckOptions {
  /** True when the category exists, is not removed and has no subcategories. */
  isLeafCategory?: (id: number) => boolean
}

/**
 * Checks what the host and the node require before anything is signed. An
 * offer without a category once took down every 0.22.20 node (28.04.2026), so
 * the category must be a real leaf of the tree.
 */
export function checkOffer(
  offer: Offer,
  options: OfferCheckOptions = {}
): OfferInvalidField | null {
  if (!offer.address) return 'address'
  if (!offer.language.trim()) return 'language'
  if (!offer.caption.trim()) return 'caption'
  if (!offer.description.trim()) return 'description'
  const tag = offer.tag
  if (tag === null || !Number.isInteger(tag) || tag <= 0) return 'tag'
  if (options.isLeafCategory && !options.isLeafCategory(tag)) return 'tag'
  if (!Array.isArray(offer.tags)) return 'tags'
  if (!offer.condition) return 'condition'
  if (!Array.isArray(offer.images)) return 'images'
  if (!offer.geohash) return 'geohash'
  if (!Number.isInteger(offer.priceCents) || offer.priceCents < 0) return 'price'
  if (typeof offer.video !== 'string') return 'video'
  return null
}

/** Builds the payload for `sdk.barteron.offer`; throws `OfferInvalidError` instead of sending a broken offer. */
export function toOfferPayload(offer: Offer, options: OfferCheckOptions = {}): OfferPayload {
  const invalid = checkOffer(offer, options)
  if (invalid) throw new OfferInvalidError(invalid)
  return {
    address: offer.address,
    hash: isTxid(offer.hash) ? offer.hash : null,
    language: offer.language,
    caption: offer.caption,
    description: offer.description,
    tag: offer.tag!,
    tags: offer.tags,
    condition: offer.condition,
    images: offer.images,
    geohash: offer.geohash,
    video: offer.video,
    currencyPrice: offer.currencyPrice,
    delivery: offer.delivery,
    videoSettings: offer.videoSettings,
    safeDeal: offer.safeDeal,
    metaData: offer.metaData,
    price: offer.priceCents,
    published: offer.published,
  }
}

/** Same offer, other publication state: withdrawing and renewing write a new version. */
export function withPublication(offer: Offer, published: OfferPublication): Offer {
  return { ...offer, published }
}

/** A version the host is still sending: its `expObject` (alias) back into an offer. */
export function offerFromAlias(
  alias: unknown,
  txid: string | null,
  now = Date.now()
): Offer | null {
  if (!isJsonObject(alias)) return null
  const hash = isTxid(alias.hash) ? alias.hash : txid
  const price = typeof alias.price === 'number' ? alias.price : 0
  return {
    ...emptyOffer(str(alias.address), str(alias.language), now),
    hash,
    txHash: txid,
    caption: str(alias.caption),
    description: str(alias.description),
    tag: toTag(alias.tag),
    tags: toExchangeTags(alias.tags),
    condition: str(alias.condition, 'new') || 'new',
    images: Array.isArray(alias.images)
      ? alias.images.filter((i): i is string => typeof i === 'string')
      : [],
    geohash: str(alias.geohash),
    video: str(alias.video),
    currencyPrice: objectOr(alias.currencyPrice, {}),
    delivery: objectOr(alias.delivery, {}),
    videoSettings: objectOr(alias.videoSettings, {}),
    safeDeal: objectOr(alias.safeDeal, {}),
    metaData: objectOr(alias.metaData, {}),
    priceCents: price,
    published: toPublication(alias.published),
  }
}
