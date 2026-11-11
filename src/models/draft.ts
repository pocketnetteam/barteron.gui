/**
 * The offer form (s4): what the seller fills in, step by step, before it is
 * published. The draft lives on the device (new in this version: the old app
 * kept nothing) and becomes an `Offer` only when it is sent.
 *
 * What lands on chain follows the old form exactly (barteron.gui
 * `views/Barter/Create/content/index.js`, `serializeForm`):
 * - `tags`: category ids, `['my_list']` or `['for_nothing']`; «Что-нибудь» is
 *   an empty list — both hosts accept it and the old app just hides «Меняю на»;
 * - `currencyPrice`: `{currency, price}` when the price is fixed in a currency;
 * - `metaData.price.prefix = 'from'` for «Цена от»; switching it off removes
 *   it (the old form kept it — a bug);
 * - `delivery.deliveryOptions` only when at least one way is on, otherwise
 *   `{}`; a pickup point writes `delivery.pickupPoint` instead;
 * - `safeDeal`: `{validatorFeeVariant: 'seller' | 'inHalf'}` or `{}`;
 * - `published`: always `published`, editing included.
 * Fields the form does not know (other `metaData` keys, a guarantor in
 * `safeDeal`) are written back as they were.
 */

import type { Rates } from '@/api/rates'
import type { CategoryNames, CategoryTree } from './categories'
import { deliveryOptions, pickupPointInfo, type WorkDay } from './delivery'
import {
  emptyOffer,
  fixedCurrencyPrice,
  FOR_NOTHING,
  isPickupPoint,
  MY_LIST,
  PICKUP_POINT_CATEGORY,
  PKOIN_TOTAL_SUPPLY,
  toPriceCents,
  type Offer,
  type OfferCurrencyPrice,
} from './offer'
import { isJsonObject, isTxid, type JsonObject } from './tx'

export const PKOIN = 'PKOIN'
/** «Покеткоины»: with them in the exchange list a buyer may pay through a guarantor. */
export const PKOIN_CATEGORY = 17
export const MAX_PHOTOS = 10
/** The old form's limits. */
export const MAX_DESCRIPTION = 9000
export const MAX_DELIVERY_INFO = 1000
export const MAX_FINANCIAL_TERMS = 250
export const MAX_SCHEDULE_INFO = 500
export const MAX_ADDRESS = 200
export const MAX_ROUTE = 1000
/** «Часто выбирают» in the exchange list: the old form's quick picks. */
export const QUICK_EXCHANGE = [17, 38, 13, 11116, 23, 13587, 26395, 6, 9]

/**
 * - `own` — categories for this offer;
 * - `my_list` — the list from my Barteron profile;
 * - `anything` — any offers (empty list);
 * - `for_nothing` — free, no price.
 */
export type ExchangeMode = 'own' | 'my_list' | 'anything' | 'for_nothing'
/** Guarantor's fee: '' — the buyer pays, `inHalf` — split, `seller` — the seller pays. */
export type FeeVariant = '' | 'inHalf' | 'seller'
export type VideoOrder = 'first' | 'last'

export interface DraftPhoto {
  /** Local id: list keys, retries. */
  id: string
  /** Where Bastyon put it; `null` while uploading or after a failure. */
  url: string | null
  status: 'uploading' | 'ready' | 'failed'
  /** The shrunk picture, for a retry. Never stored on the device. */
  data?: string
  /** Size sent; 0 — unknown (an existing photo). */
  bytes: number
}

export interface DraftDay {
  open: boolean
  allDay: boolean
  /** `HH:MM`. */
  start: string
  finish: string
}

export interface DraftPoint {
  financialTerms: string
  /** Monday first. */
  days: DraftDay[]
  scheduleInfo: string
  address: string
  route: string
}

export interface OfferDraft {
  /** Format of the stored draft. */
  v: 1
  /** Editing: the offer id. */
  hash: string | null
  /** Editing: the version the form started from; a newer one on chain makes the draft stale. */
  baseTxHash: string | null
  caption: string
  description: string
  tag: number | null
  condition: 'new' | 'used'
  photos: DraftPhoto[]
  video: string
  /** Uploaded in this form, not yet in a published version: discarding the draft removes it from storage. */
  videoUploadedHere: boolean
  videoOrder: VideoOrder
  exchange: ExchangeMode
  tags: number[]
  /** As typed: «12 400», «0,29». */
  price: string
  /** `PKOIN` or a currency code. */
  currency: string
  /** Keep the price in the currency; the PKOIN price follows the rate. */
  fixCurrency: boolean
  priceFrom: boolean
  fee: FeeVariant
  geohash: string
  selfPickup: { on: boolean; info: string }
  directDelivery: { on: boolean; info: string }
  pickupPoints: { on: boolean; ids: string[] }
  point: DraftPoint
  /** Last change, ms. */
  updatedAt: number
}

const DEFAULT_DAY: DraftDay = { open: true, allDay: false, start: '10:00', finish: '20:00' }

export function newPoint(): DraftPoint {
  return {
    financialTerms: '',
    days: Array.from({ length: 7 }, (_, i) => ({ ...DEFAULT_DAY, open: i < 5 })),
    scheduleInfo: '',
    address: '',
    route: '',
  }
}

export function newDraft(currency: string, now = Date.now()): OfferDraft {
  return {
    v: 1,
    hash: null,
    baseTxHash: null,
    caption: '',
    description: '',
    tag: null,
    condition: 'new',
    photos: [],
    video: '',
    videoUploadedHere: false,
    videoOrder: 'first',
    exchange: 'own',
    tags: [],
    price: '',
    currency,
    fixCurrency: currency !== PKOIN,
    priceFrom: false,
    fee: '',
    geohash: '',
    selfPickup: { on: false, info: '' },
    directDelivery: { on: false, info: '' },
    pickupPoints: { on: false, ids: [] },
    point: newPoint(),
    updatedAt: now,
  }
}

let photoCounter = 0
export const photoId = (): string => `ph${Date.now().toString(36)}${(photoCounter++).toString(36)}`

/** «12 400» or «0,29» → 12400 / 0.29; NaN when it is not a number. */
export function parsePrice(text: string): number {
  const clean = text.replace(/[\s\u00a0\u202f']/g, '').replace(',', '.')
  if (!clean) return NaN
  return /^\d*\.?\d*$/.test(clean) ? Number(clean) : NaN
}

/** A number for the price field: «1250», «0,29» in Russian. */
export function priceText(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    value
  )
}

function draftDays(days: WorkDay[]): DraftDay[] {
  return days.map((day) =>
    day === null
      ? { ...DEFAULT_DAY, open: false }
      : 'allDay' in day
        ? { ...DEFAULT_DAY, open: true, allDay: true }
        : { open: true, allDay: false, start: day.start, finish: day.finish }
  )
}

/** The form for an existing offer: editing. */
export function draftFromOffer(offer: Offer, locale: string, now = Date.now()): OfferDraft {
  const fixed = fixedCurrencyPrice(offer)
  const options = deliveryOptions(offer)
  const point = isPickupPoint(offer) ? pickupPointInfo(offer) : null
  const prefix = isJsonObject(offer.metaData.price) ? offer.metaData.price.prefix : undefined
  const fee = offer.safeDeal.validatorFeeVariant
  const exchange: ExchangeMode = offer.tags.includes(FOR_NOTHING)
    ? 'for_nothing'
    : offer.tags.includes(MY_LIST)
      ? 'my_list'
      : offer.tags.some((t) => typeof t === 'number')
        ? 'own'
        : 'anything'
  const order = offer.videoSettings.order
  return {
    ...newDraft(fixed ? fixed.currency : PKOIN, now),
    hash: offer.hash,
    baseTxHash: offer.txHash,
    caption: offer.caption,
    description: offer.description,
    tag: offer.tag,
    condition: offer.condition === 'used' ? 'used' : 'new',
    photos: offer.images.map((url) => ({ id: photoId(), url, status: 'ready', bytes: 0 })),
    video: offer.video,
    videoOrder: order === 'last' ? 'last' : 'first',
    exchange,
    tags: offer.tags.filter((t): t is number => typeof t === 'number'),
    price:
      exchange === 'for_nothing' && !offer.priceCents
        ? ''
        : priceText(fixed ? fixed.amount : offer.priceCents / 100, locale),
    fixCurrency: !!fixed,
    priceFrom: prefix === 'from',
    fee: fee === 'seller' || fee === 'inHalf' ? fee : '',
    geohash: offer.geohash,
    selfPickup: { on: options.selfPickup.enabled, info: options.selfPickup.info },
    directDelivery: { on: options.directDelivery.enabled, info: options.directDelivery.info },
    pickupPoints: { on: options.pickupPoints.enabled, ids: options.pickupPoints.ids },
    point: point
      ? {
          financialTerms: point.financialTerms,
          days: draftDays(point.schedule.days),
          scheduleInfo: point.schedule.info,
          address: point.address,
          route: point.route,
        }
      : newPoint(),
  }
}

export const isPointDraft = (draft: Pick<OfferDraft, 'tag'>): boolean =>
  draft.tag === PICKUP_POINT_CATEGORY

/** The list the buyer sees, with «Мой список» resolved. */
export function draftExchangeCategories(
  draft: Pick<OfferDraft, 'exchange' | 'tags'>,
  myList: readonly number[]
): number[] {
  if (draft.exchange === 'own') return draft.tags
  if (draft.exchange === 'my_list') return [...myList]
  return []
}

/** A buyer may pay through a guarantor only for PKOIN; pickup points have no deals. */
export function safeDealPossible(
  draft: Pick<OfferDraft, 'exchange' | 'tags' | 'tag'>,
  myList: readonly number[]
): boolean {
  return !isPointDraft(draft) && draftExchangeCategories(draft, myList).includes(PKOIN_CATEGORY)
}

export type PriceOutcome =
  | { ok: true; cents: number; currencyPrice: OfferCurrencyPrice; pkoin: number }
  | { ok: false; reason: 'missing' | 'invalid' | 'tooBig' | 'noRate' }

/**
 * What goes on chain for the price. `p.i1` holds PKOIN at publishing; a price
 * fixed in a currency also goes into `currencyPrice`, and buyers see the PKOIN
 * amount by today's rate. A currency price that is not fixed is turned into
 * PKOIN once, now.
 */
export function draftPrice(
  draft: Pick<OfferDraft, 'exchange' | 'price' | 'currency' | 'fixCurrency'>,
  rates: Rates | null | undefined
): PriceOutcome {
  if (draft.exchange === 'for_nothing') return { ok: true, cents: 0, currencyPrice: {}, pkoin: 0 }
  const amount = parsePrice(draft.price)
  if (!draft.price.trim()) return { ok: false, reason: 'missing' }
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, reason: 'invalid' }
  if (amount === 0) return { ok: false, reason: 'missing' }
  if (draft.currency === PKOIN) {
    if (amount > PKOIN_TOTAL_SUPPLY) return { ok: false, reason: 'tooBig' }
    return { ok: true, cents: toPriceCents(amount), currencyPrice: {}, pkoin: amount }
  }
  const rate = rates?.[draft.currency]
  if (!rate) return { ok: false, reason: 'noRate' }
  const pkoin = amount / rate
  // The old app checked the total supply only for a PKOIN price.
  if (!draft.fixCurrency && pkoin > PKOIN_TOTAL_SUPPLY) return { ok: false, reason: 'tooBig' }
  return {
    ok: true,
    cents: toPriceCents(pkoin),
    currencyPrice: draft.fixCurrency ? { currency: draft.currency, price: amount } : {},
    pkoin,
  }
}

function pointDelivery(point: DraftPoint): JsonObject {
  const weekDays: JsonObject = {}
  point.days.forEach((day, i) => {
    if (!day.open) return
    weekDays[`day${i + 1}`] = day.allDay
      ? { allDay: true }
      : { startTime: day.start, finishTime: day.finish }
  })
  return {
    pickupPoint: {
      financialTerms: point.financialTerms.trim(),
      workSchedule: { weekDays, additionalInfo: point.scheduleInfo.trim() },
      address: point.address.trim().slice(0, MAX_ADDRESS),
      route: point.route.trim(),
    },
  }
}

function optionsDelivery(draft: OfferDraft): JsonObject {
  const { selfPickup, directDelivery, pickupPoints } = draft
  if (!selfPickup.on && !directDelivery.on && !pickupPoints.on) return {}
  return {
    deliveryOptions: {
      pickupPoints: { isEnabled: pickupPoints.on, ids: pickupPoints.on ? pickupPoints.ids : [] },
      selfPickup: { isEnabled: selfPickup.on, additionalInfo: selfPickup.info.trim() },
      directDelivery: { isEnabled: directDelivery.on, additionalInfo: directDelivery.info.trim() },
    },
  }
}

export interface DraftContext {
  address: string
  /** `ru-RU`, as the old app wrote `$i18n.locale`. */
  language: string
  rates?: Rates | null
  myList?: readonly number[]
  /** Editing: the version on chain, for the fields the form does not touch. */
  base?: Offer | null
  now?: number
}

/**
 * The offer to send or to preview. Without a valid price it carries 0: the
 * issues list says what is wrong, and nothing invalid is ever sent
 * (`toOfferPayload` checks again).
 */
export function offerFromDraft(draft: OfferDraft, ctx: DraftContext): Offer {
  const now = ctx.now ?? Date.now()
  const base = ctx.base ?? emptyOffer(ctx.address, ctx.language, now)
  const point = isPointDraft(draft)
  const price = draftPrice(draft, ctx.rates)
  const myList = ctx.myList ?? []

  const tags: Offer['tags'] = point
    ? // A pickup point is not exchanged: no list for a new one, the old list kept on edit.
      ctx.base
      ? base.tags
      : []
    : draft.exchange === 'for_nothing'
      ? [FOR_NOTHING]
      : draft.exchange === 'my_list'
        ? [MY_LIST]
        : draft.exchange === 'own'
          ? [...draft.tags]
          : []

  const metaData: JsonObject = { ...base.metaData }
  const priceMeta = isJsonObject(metaData.price) ? { ...metaData.price } : {}
  if (draft.priceFrom && !point) priceMeta.prefix = 'from'
  else delete priceMeta.prefix
  if (Object.keys(priceMeta).length) metaData.price = priceMeta
  else delete metaData.price

  const safeDeal: JsonObject = { ...base.safeDeal }
  delete safeDeal.validatorFeeVariant
  if (draft.fee && safeDealPossible(draft, myList)) safeDeal.validatorFeeVariant = draft.fee

  const ready = draft.photos.filter((p) => p.status === 'ready' && p.url).map((p) => p.url!)

  return {
    ...base,
    hash: draft.hash,
    txHash: base.txHash,
    address: ctx.address,
    language: base.language || ctx.language,
    caption: draft.caption.trim(),
    description: draft.description.trim(),
    tag: draft.tag,
    tags,
    condition: draft.condition,
    images: ready,
    // A pickup point has no video in the form; one it had stays.
    video: point ? (ctx.base?.video ?? '') : draft.video,
    // The old form always wrote the order, with a video or without.
    videoSettings: { ...base.videoSettings, order: draft.videoOrder },
    currencyPrice: price.ok ? price.currencyPrice : {},
    priceCents: price.ok ? price.cents : 0,
    metaData,
    safeDeal: point ? base.safeDeal : safeDeal,
    delivery: point ? pointDelivery(draft.point) : optionsDelivery(draft),
    geohash: draft.geohash,
    published: 'published',
    time: ctx.base ? base.time : now,
  }
}

// ─── What is missing ────────────────────────────────────────────────────────

export type DraftStep = 'what' | 'media' | 'exchange' | 'point' | 'place' | 'review'

export const SELL_STEPS: DraftStep[] = ['what', 'media', 'exchange', 'place', 'review']
export const POINT_STEPS: DraftStep[] = ['what', 'media', 'point', 'place', 'review']

export const stepsOf = (draft: Pick<OfferDraft, 'tag'>): DraftStep[] =>
  isPointDraft(draft) ? POINT_STEPS : SELL_STEPS

/** `error` blocks «Далее» and publishing; `wait` only publishing (an upload in progress). */
export type IssueLevel = 'error' | 'wait'

export interface DraftIssue {
  step: DraftStep
  /** Field id: where to scroll and what to mark. */
  field: string
  /** Text key under `create.issue`. */
  key: string
  level: IssueLevel
  params?: Record<string, string | number>
}

export interface IssueContext {
  tree?: CategoryTree | null
  rates?: Rates | null
  /** Video state from the host; `null` — no video. */
  videoStatus?: 'loading' | 'processing' | 'ready' | 'failed' | 'missing' | null
  myList?: readonly number[]
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Everything that keeps the draft from being published, in step order. */
export function draftIssues(draft: OfferDraft, ctx: IssueContext = {}): DraftIssue[] {
  const issues: DraftIssue[] = []
  const add = (
    step: DraftStep,
    field: string,
    key: string,
    level: IssueLevel = 'error',
    params?: Record<string, string | number>
  ) => issues.push({ step, field, key, level, params })
  const point = isPointDraft(draft)

  // 1. What
  if (!draft.caption.trim()) add('what', 'caption', 'caption')
  if (draft.tag === null) add('what', 'category', 'category')
  else if (ctx.tree && !ctx.tree.isLeaf(draft.tag)) add('what', 'category', 'categoryWide')
  if (!draft.description.trim()) add('what', 'description', 'description')
  else if (draft.description.length > MAX_DESCRIPTION) add('what', 'description', 'tooLong')

  // 2. Photos and video
  const failed = draft.photos
    .map((p, i) => (p.status === 'failed' ? i + 1 : 0))
    .filter((n) => n > 0)
  if (failed.length) add('media', 'photos', 'photosFailed', 'error', { numbers: failed.join(', ') })
  if (draft.photos.some((p) => p.status === 'uploading'))
    add('media', 'photos', 'photosUploading', 'wait')
  else if (!draft.photos.some((p) => p.status === 'ready')) add('media', 'photos', 'photos')
  if (draft.video && !point) {
    if (ctx.videoStatus === 'processing' || ctx.videoStatus === 'loading') {
      add('media', 'video', 'videoProcessing', 'wait')
    } else if (ctx.videoStatus === 'failed') add('media', 'video', 'videoFailed')
  }

  // 3. Exchange and price, or the pickup point's terms
  if (point) {
    const price = draftPrice({ ...draft, exchange: 'own' }, ctx.rates)
    if (!price.ok) add('point', 'price', `pointPrice.${price.reason}`)
    if (!draft.point.financialTerms.trim()) add('point', 'financialTerms', 'financialTerms')
    const open = draft.point.days.filter((d) => d.open)
    if (!open.length) add('point', 'schedule', 'scheduleEmpty')
    else if (
      open.some(
        (d) => !d.allDay && (!TIME.test(d.start) || !TIME.test(d.finish) || d.start >= d.finish)
      )
    ) {
      add('point', 'schedule', 'scheduleTime')
    }
    if (!draft.point.address.trim()) add('point', 'address', 'address')
    if (!draft.point.route.trim()) add('point', 'route', 'route')
  } else {
    if (draft.exchange === 'own' && !draft.tags.length) add('exchange', 'tags', 'tags')
    if (draft.exchange === 'my_list' && ctx.myList && !ctx.myList.length) {
      add('exchange', 'tags', 'myListEmpty')
    }
    if (draft.exchange !== 'for_nothing') {
      const price = draftPrice(draft, ctx.rates)
      if (!price.ok) add('exchange', 'price', `price.${price.reason}`)
    }
  }

  // 4. Place and delivery
  if (!draft.geohash) add('place', 'place', 'place')
  if (!point && draft.pickupPoints.on && !draft.pickupPoints.ids.length) {
    add('place', 'delivery', 'pickupPoints')
  }
  return issues
}

/** Steps with something to fix. */
export const stepsWithErrors = (issues: readonly DraftIssue[]): Set<DraftStep> =>
  new Set(issues.filter((i) => i.level === 'error').map((i) => i.step))

// ─── Category from the caption ───────────────────────────────────────────────

/** Rough stem: «планшета» → «планше», enough to find «Планшеты». */
const stem = (word: string): string =>
  word.length > 6 ? word.slice(0, -2) : word.length > 4 ? word.slice(0, -1) : word

/**
 * «Подобрали по названию»: leaf categories whose names share words with the
 * caption, the ones matching more words first. The first word counts most:
 * a title starts with the thing itself («Планшет …, с чехлом-клавиатурой»).
 * There is no node method for this; the category names are all we have.
 */
export function suggestCategories(
  caption: string,
  tree: CategoryTree,
  names: CategoryNames,
  limit = 3
): number[] {
  const words = [
    ...new Set(
      caption
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((w) => w.length >= 3 && !/^\d+$/.test(w))
    ),
  ]
  const score = new Map<number, number>()
  words.forEach((word, index) => {
    const weight = 1 / (1 + index)
    tree.search(stem(word), names, 40).forEach((category, rank) => {
      if (!tree.isLeaf(category.id) || category.id === PICKUP_POINT_CATEGORY) return
      score.set(category.id, (score.get(category.id) ?? 0) + (100 - rank) * weight)
    })
  })
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

/** The stored draft back, or `null` when it is not one. */
export function readDraft(value: unknown): OfferDraft | null {
  if (!isJsonObject(value) || value.v !== 1) return null
  const base = newDraft(typeof value.currency === 'string' ? value.currency : PKOIN)
  const draft = { ...base, ...value } as OfferDraft
  if (!Array.isArray(draft.photos) || !Array.isArray(draft.tags)) return null
  draft.photos = draft.photos.filter(
    (p) => isJsonObject(p) && typeof p.url === 'string' && p.status === 'ready'
  )
  if (!isJsonObject(draft.point) || !Array.isArray(draft.point.days)) draft.point = newPoint()
  return draft
}

/** What is stored: uploaded photos only, without picture data. */
export function storedDraft(draft: OfferDraft): OfferDraft {
  return {
    ...draft,
    photos: draft.photos
      .filter((p) => p.status === 'ready' && p.url)
      .map(({ id, url, bytes }) => ({ id, url, status: 'ready' as const, bytes })),
  }
}

/** Something was typed: worth keeping and worth asking before leaving. */
export function draftHasContent(draft: OfferDraft): boolean {
  return (
    !!draft.caption.trim() ||
    !!draft.description.trim() ||
    draft.tag !== null ||
    draft.photos.length > 0 ||
    !!draft.video
  )
}

export interface DraftEntry {
  /** Storage key. */
  key: string
  /** The offer being edited; `null` — the draft of a new offer. */
  hash: string | null
  draft: OfferDraft
}

/**
 * The drafts of one user among stored `[key, value]` pairs, newest first:
 * `<address>_offer_draft` and `<address>_offer_draft_<id>` (edits). Empty ones
 * are left out.
 */
export function draftEntries(
  address: string,
  items: readonly (readonly [string, unknown])[]
): DraftEntry[] {
  const base = `${address}_offer_draft`
  return items
    .flatMap(([key, value]): DraftEntry[] => {
      if (key !== base && !key.startsWith(`${base}_`)) return []
      const hash = key === base ? null : key.slice(base.length + 1)
      if (hash !== null && !isTxid(hash)) return []
      const draft = readDraft(value)
      return draft && draftHasContent(draft) ? [{ key, hash, draft }] : []
    })
    .sort((a, b) => b.draft.updatedAt - a.draft.updatedAt)
}
