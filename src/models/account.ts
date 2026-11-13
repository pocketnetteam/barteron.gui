/**
 * Barteron profile: transaction `brtaccount`, type 104. One per address; a new
 * version replaces the old one.
 *
 * Read side follows barteron.gui `src/js/models/account.js`; the payload for
 * `sdk.barteron.account` holds the fields the host serialises (pocketnet.gui
 * `js/kit.js` brtAccount, bastyon-nextgen `src/mini-apps/tx/legacy-objects.ts`).
 *
 * Chain layout: `s1` — address; `p.s4` — JSON `{a, g, s, r, d, m}`: my
 * exchange list, location geohash, static location, radius in km, safe deal
 * settings (guarantors keep their fee here), metadata. `getbarteronaccounts`
 * adds `additional: {regdate, rating, rating_sum, rating_count}`.
 */

import { decodeGeohash, encodeGeohash, OFFER_PRECISION } from '@/lib/geohash'
import {
  isJsonObject,
  objectOr,
  parseJsonObject,
  str,
  txTimeMs,
  type JsonObject,
  type RawTx,
} from './tx'

export interface VotingModerationItem extends JsonObject {
  /** When the request was made or access was granted, ms. */
  createdAt?: number
}

export interface ModeratorSettings extends JsonObject {
  /** `available` — takes requests; anything else — does not (old `moderator-profile`). */
  status?: string
}

export interface VotingModeration extends JsonObject {
  /** Set by moderators only. */
  moderator?: ModeratorSettings
  requestItems?: VotingModerationItem[]
  accessItems?: VotingModerationItem[]
}

export interface AccountMetaData extends JsonObject {
  votingModeration?: VotingModeration
}

export interface GuarantorSettings extends JsonObject {
  /** `available` — takes new deals; anything else — does not. */
  status?: string
  /** Fee, percent. */
  feePercent?: number
}

export interface AccountSafeDeal extends JsonObject {
  /** Set by guarantors only (old `safe-deal-profile`). */
  validator?: GuarantorSettings
}

export interface BarteronAccount {
  address: string
  /** txid of the version read; `null` — the address has no Barteron profile yet. */
  hash: string | null
  height: number
  /** When this version was written, ms; 0 — no profile. */
  time: number
  /** «Мой список обмена»: category ids. */
  tags: number[]
  geohash: string
  /** Location set by hand, not taken from the device. */
  static: boolean
  /** Search radius, km. */
  radius: number
  safeDeal: AccountSafeDeal
  metaData: AccountMetaData
  /** First seen on Barteron, ms; `null` when the node did not say. */
  regdate: number | null
  /** Average rating 0–5. */
  rating: number
  ratingSum: number
  ratingCount: number
}

/** Moderation requests and grants live a week (old `votingModerationItemsInterval`). */
export const VOTING_MODERATION_TTL = 7 * 24 * 3600 * 1000

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const toTags = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map((t) => (typeof t === 'string' ? Number(t) : t)).filter(Number.isFinite)
    : []

/** Drops moderation items older than a week, as the old model did on every update. */
export function freshVotingModeration(
  metaData: AccountMetaData,
  now = Date.now()
): AccountMetaData {
  const voting = metaData.votingModeration
  if (!isJsonObject(voting)) return metaData
  const fresh = (items: unknown): VotingModerationItem[] =>
    Array.isArray(items)
      ? items.filter(
          (i: VotingModerationItem) => num(i?.createdAt, -Infinity) > now - VOTING_MODERATION_TTL
        )
      : []
  return {
    ...metaData,
    votingModeration: {
      ...voting,
      ...(voting.requestItems !== undefined && { requestItems: fresh(voting.requestItems) }),
      ...(voting.accessItems !== undefined && { accessItems: fresh(voting.accessItems) }),
    },
  }
}

export function emptyAccount(address: string): BarteronAccount {
  return {
    address,
    hash: null,
    height: 0,
    time: 0,
    tags: [],
    geohash: '',
    static: false,
    radius: 0,
    safeDeal: {},
    metaData: {},
    regdate: null,
    rating: 0,
    ratingSum: 0,
    ratingCount: 0,
  }
}

interface AccountTx extends RawTx {
  additional?: { regdate?: number; rating?: number; rating_sum?: number; rating_count?: number }
}

/** Reads a profile from `getbarteronaccounts` (or the `accounts` of `getbarteronoffersdetails`). */
export function parseAccount(tx: AccountTx, now = Date.now()): BarteronAccount {
  const json = parseJsonObject(tx.p?.s4)
  const extra = tx.additional ?? {}
  return {
    address: str(tx.s1),
    hash: tx.hash || null,
    height: num(tx.height),
    time: txTimeMs(tx.time, now),
    tags: toTags(json.a),
    geohash: str(json.g),
    static: json.s === true,
    radius: num(json.r),
    safeDeal: objectOr(json.d, {}),
    metaData: freshVotingModeration(objectOr(json.m, {}), now),
    regdate: typeof extra.regdate === 'number' && extra.regdate > 0 ? extra.regdate * 1000 : null,
    // The node keeps the rating multiplied by ten.
    rating: num(extra.rating) / 10,
    ratingSum: num(extra.rating_sum),
    ratingCount: num(extra.rating_count),
  }
}

/** What `sdk.barteron.account` receives. */
export interface AccountPayload {
  address: string
  tags: number[]
  geohash: string
  static: boolean
  radius: number
  safeDeal: AccountSafeDeal
  metaData: AccountMetaData
}

export function toAccountPayload(account: BarteronAccount): AccountPayload {
  return {
    address: account.address,
    tags: account.tags,
    geohash: account.geohash,
    static: account.static,
    radius: account.radius,
    safeDeal: account.safeDeal,
    metaData: account.metaData,
  }
}

/** A version the host is still sending: its `expObject` (alias) over the known profile. */
export function accountFromAlias(
  alias: unknown,
  base: BarteronAccount | null
): BarteronAccount | null {
  if (!isJsonObject(alias) || typeof alias.address !== 'string') return null
  const from = base ?? emptyAccount(alias.address)
  return {
    ...from,
    tags: alias.tags == null ? from.tags : toTags(alias.tags),
    geohash: typeof alias.geohash === 'string' ? alias.geohash : from.geohash,
    static: typeof alias.static === 'boolean' ? alias.static : from.static,
    radius: typeof alias.radius === 'number' ? alias.radius : from.radius,
    safeDeal: isJsonObject(alias.safeDeal) ? alias.safeDeal : from.safeDeal,
    metaData: isJsonObject(alias.metaData) ? alias.metaData : from.metaData,
  }
}

// ─── Place for new offers: `g` and `s` ───────────────────────────────────────

/**
 * The profile is open to everyone and its old versions stay in the chain, so
 * «Место для новых объявлений» goes there only roughly: 6 characters, a cell
 * of about 1.2 × 0.6 km. The old app never wrote `g`; it shows the city of it.
 */
export const HOME_PLACE_PRECISION = 6

/** The profile with a place for new offers, or without one (`null`, «По геопозиции»). */
export function withHomePlace(account: BarteronAccount, geohash: string | null): BarteronAccount {
  return geohash
    ? { ...account, static: true, geohash: geohash.slice(0, HOME_PLACE_PRECISION) }
    : { ...account, static: false, geohash: '' }
}

/**
 * Where a new offer starts: the middle of the profile's place, in full like
 * any offer, so searches by smaller areas find it. `''` — no place set.
 */
export function homePlaceStart(account: BarteronAccount | null | undefined): string {
  if (!account?.static) return ''
  const middle = decodeGeohash(account.geohash)
  return middle ? encodeGeohash(middle, OFFER_PRECISION) : ''
}

// ─── Roles: what guarantors and moderators keep in their profile ─────────────

export const ROLE_AVAILABLE = 'available'
export const ROLE_UNAVAILABLE = 'unavailable'

/** The old form took 1–98: `0 < fee < 99` (safe-deal-profile `checkData`). */
export const isValidGuarantorFee = (fee: number): boolean =>
  Number.isFinite(fee) && fee > 0 && fee < 99

export interface GuarantorState {
  available: boolean
  feePercent: number
}

/** A guarantor's status and fee; an unset fee is the default one, as the old app showed it. */
export function guarantorState(account: BarteronAccount, defaultFee: number): GuarantorState {
  const validator = isJsonObject(account.safeDeal.validator) ? account.safeDeal.validator : {}
  const fee = Number(validator.feePercent)
  return {
    available: validator.status === ROLE_AVAILABLE,
    feePercent: Number.isFinite(fee) && fee > 0 ? fee : defaultFee,
  }
}

/** The profile with new guarantor settings; other keys of `safeDeal` stay. */
export function withGuarantor(account: BarteronAccount, state: GuarantorState): BarteronAccount {
  const validator = isJsonObject(account.safeDeal.validator) ? account.safeDeal.validator : {}
  return {
    ...account,
    safeDeal: {
      ...account.safeDeal,
      validator: {
        ...validator,
        status: state.available ? ROLE_AVAILABLE : ROLE_UNAVAILABLE,
        feePercent: state.feePercent,
      },
    },
  }
}

export const moderatorAvailable = (account: BarteronAccount): boolean =>
  account.metaData.votingModeration?.moderator?.status === ROLE_AVAILABLE

/** The profile with a new moderator status; requests and grants stay. */
export function withModerator(account: BarteronAccount, available: boolean): BarteronAccount {
  const voting = isJsonObject(account.metaData.votingModeration)
    ? account.metaData.votingModeration
    : {}
  const moderator = isJsonObject(voting.moderator) ? voting.moderator : {}
  return {
    ...account,
    metaData: {
      ...account.metaData,
      votingModeration: {
        ...voting,
        moderator: { ...moderator, status: available ? ROLE_AVAILABLE : ROLE_UNAVAILABLE },
      },
    },
  }
}

/**
 * A moderator may go off duty only while someone else is on it: otherwise
 * low scores would have nobody to approve them (old `checkSaving`).
 */
export const canLeaveModeration = (others: readonly BarteronAccount[]): boolean =>
  others.some(moderatorAvailable)
