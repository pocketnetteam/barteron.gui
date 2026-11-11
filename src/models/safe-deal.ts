/**
 * Safe deal: the buyer pays a guarantor, the guarantor pays the seller or
 * returns the money. Barteron keeps no record of a deal anywhere: the link
 * holds its parameters, the chain holds its transfers.
 *
 * Follows barteron.gui `src/js/safeDealUtils.js` (`IdHelper`) and
 * `src/views/Barter/SafeDeal/content/index.js`. The id, the link and the
 * payment message must stay exactly as the old app made them, or deals
 * started there will not open here and the other way round.
 *
 * - Link: `barter/safedeal?id=…&offer=…&buyer=…&validator=…&fee=…`.
 * - Id, version 1: 16 random hex + the first 8 hex of
 *   `md5(random + offer + buyer + validator + fee + version)` + the version in
 *   two hex digits. It only proves the link was not edited.
 * - Every transfer of the deal carries `Safe deal <id>` in OP_RETURN; the node
 *   finds transfers by that exact script (`getfromtotransactions`).
 * - Status: buyer → guarantor means paid (2); guarantor → seller — done (4a);
 *   guarantor → buyer — cancelled (4b). A transfer counts with 6 blocks on top
 *   of it, as before; one in a block with fewer is on its way (3a, 3b, or the
 *   payment of status 1).
 */

import { isGuarantor } from '@/config/roles'
import { md5 } from '@/lib/md5'
import {
  dealIdFromMessage,
  parseTransfers,
  paymentMessage,
  type DealTransfer,
} from './deal-transfer'
import type { Offer } from './offer'
import { isJsonObject, isTxid } from './tx'

export const DEAL_ID_VERSION = 1

/** No safe deal transfers before this block (old `minDepthForSafeDealFeature`). */
export const SAFE_DEAL_START_HEIGHT = 3_466_240

/** Blocks on top of a transfer before it counts (old `minConfirmationsForPayment`). */
export const MIN_CONFIRMATIONS = 6

/** After my transfer, «ждём блок» lasts this long at most (old `waitingIntervalMs`). */
export const PAYMENT_WAIT_MS = 20 * 60 * 1000

/** Hosts below this cannot read transfers between two addresses (old `safeDealAvailable`). */
export const SAFE_DEAL_API_VERSION = 7

export interface DealParams {
  id: string
  /** Offer id. */
  offer: string
  buyer: string
  /** The guarantor. */
  validator: string
  /** Guarantor fee, percent, as written in the link: it is part of the id. */
  fee: string
}

export type DealTerms = Omit<DealParams, 'id'>

const hex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

const idSource = (random: string, terms: DealTerms, version: number) =>
  `${random}${terms.offer}${terms.buyer}${terms.validator}${terms.fee}${version}`

/** A new deal id. `random` — 16 hex; only tests pass it. */
export function createDealId(terms: DealTerms, random = hex(16)): string {
  const version = DEAL_ID_VERSION
  return `${random}${md5(idSource(random, terms, version)).slice(0, 8)}${version.toString(16).padStart(2, '0')}`
}

const DEAL_ID = /^[0-9a-f]{26}$/

/** The id matches the rest of the link. Unknown versions do not. */
export function checkDealId(params: DealParams): boolean {
  if (!DEAL_ID.test(params.id)) return false
  const version = parseInt(params.id.slice(-2), 16)
  if (version !== 1) return false
  const random = params.id.slice(0, 16)
  return params.id.slice(16, 24) === md5(idSource(random, params, version)).slice(0, 8)
}

/**
 * What is wrong with a deal link:
 * - `incomplete` — a parameter is missing;
 * - `guarantor` — the guarantor is not on the list (old «Validator address is invalid»);
 * - `fee` — no guarantor fee;
 * - `id` — the id does not match the rest («Control hash does not match»).
 */
export type DealLinkProblem = 'incomplete' | 'guarantor' | 'fee' | 'id'

const first = (value: unknown): string => {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' ? v.trim() : ''
}

/** Reads a deal from the page query, checked the way the old page did. */
export function parseDealQuery(
  query: Record<string, unknown>
):
  | { params: DealParams; problem: DealLinkProblem | null }
  | { params: null; problem: 'incomplete' } {
  const params: DealParams = {
    id: first(query.id),
    offer: first(query.offer),
    buyer: first(query.buyer),
    validator: first(query.validator),
    fee: first(query.fee),
  }
  if (!params.id || !isTxid(params.offer) || !params.buyer || !params.validator) {
    return { params: null, problem: 'incomplete' }
  }
  if (!isGuarantor(params.validator)) return { params, problem: 'guarantor' }
  if (!(Number(params.fee) > 0)) return { params, problem: 'fee' }
  if (!checkDealId(params)) return { params, problem: 'id' }
  return { params, problem: null }
}

/** Query of the deal page, in the old order: id, offer, buyer, validator, fee. */
export const dealQuery = (p: DealParams): Record<string, string> => ({
  id: p.id,
  offer: p.offer,
  buyer: p.buyer,
  validator: p.validator,
  fee: p.fee,
})

/** Path for `applink`: the link that goes to the deal chat. */
export const dealPath = (p: DealParams): string =>
  `barter/safedeal?${new URLSearchParams(dealQuery(p)).toString()}`

export { dealIdFromMessage, paymentMessage }

/**
 * OP_RETURN script of a short text (`6a <length> <bytes>`) in hex: what the
 * node compares. The old `hexEncode(chr(106) + chr(length) + message)` gives
 * the same for ASCII.
 */
export function opReturnHex(text: string): string {
  const bytes = new TextEncoder().encode(text)
  if (bytes.length > 0x4b) throw new Error('OP_RETURN text is too long for one push')
  return `6a${bytes.length.toString(16).padStart(2, '0')}${Array.from(bytes, (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')}`
}

export const dealOpReturn = (id: string): string => opReturnHex(paymentMessage(id))

// ─── Money ──────────────────────────────────────────────────────────────────

/** Who pays the guarantor's fee; the seller may take part of it (old `validatorFeeVariant`). */
export type FeeVariant = 'buyer' | 'seller' | 'inHalf'

export function feeVariantOf(offer: Pick<Offer, 'safeDeal'> | null | undefined): FeeVariant {
  const value = offer && isJsonObject(offer.safeDeal) ? offer.safeDeal.validatorFeeVariant : null
  return value === 'seller' || value === 'inHalf' ? value : 'buyer'
}

/** The buyer's part of the fee. */
export const buyerShare = (variant: FeeVariant): number =>
  variant === 'buyer' ? 1 : variant === 'inHalf' ? 0.5 : 0

/** PKOIN to hundredths, as the old page rounded amounts. */
export const roundPkoin = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

export interface DealMoney {
  /** Price of the deal agreed in the chat. */
  value: number
  feePercent: number
  variant: FeeVariant
  /** The guarantor's whole fee. */
  fee: number
  /** What the buyer pays the guarantor: the price and the buyer's part of the fee. */
  payment: number
  /** What the guarantor sends the seller: the payment less the whole fee. */
  toSeller: number
}

/** The buyer's side: from the agreed price. */
export function moneyFromValue(value: number, feePercent: number, variant: FeeVariant): DealMoney {
  const fee = (value * feePercent) / 100
  return {
    value,
    feePercent,
    variant,
    fee: roundPkoin(fee),
    payment: roundPkoin(value + fee * buyerShare(variant)),
    toSeller: roundPkoin(value - fee * (1 - buyerShare(variant))),
  }
}

/**
 * The guarantor's side: from what actually came. The seller gets the payment
 * less the whole fee — 1 237,5 of 1 262,5 when a 2 % fee of 1 250 is split
 * (s7-dealvalidator). The old page divided by `1 + fee` whoever paid, which
 * underpaid the seller when the seller or both paid the fee.
 */
export function moneyFromPayment(paid: number, feePercent: number, variant: FeeVariant): DealMoney {
  const value = paid / (1 + (buyerShare(variant) * feePercent) / 100)
  const fee = (value * feePercent) / 100
  return {
    value: roundPkoin(value),
    feePercent,
    variant,
    fee: roundPkoin(fee),
    payment: paid,
    toSeller: roundPkoin(paid - fee),
  }
}

// ─── Status from the chain ──────────────────────────────────────────────────

export { parseTransfers, type DealTransfer }

export interface DealChain {
  /** Buyer → guarantor. */
  paid: DealTransfer[]
  /** Guarantor → seller. */
  toSeller: DealTransfer[]
  /** Guarantor → buyer. */
  toBuyer: DealTransfer[]
  /** Height of the last block. */
  tip: number
}

/**
 * - `1` — created: the buyer pays the guarantor;
 * - `2` — the guarantor holds the payment and decides;
 * - `3a` / `3b` — the guarantor's transfer to the seller / back to the buyer
 *   is in a block, short of confirmations;
 * - `4a` — done, the seller has the money; `4b` — cancelled, the buyer has it back.
 */
export type DealStatus = '1' | '2' | '3a' | '3b' | '4a' | '4b'

export interface DealState {
  status: DealStatus
  /** Confirmed buyer payments, PKOIN. */
  paid: number
  /** The transfer behind the status: the payment for 2, the guarantor's for 3 and 4. */
  transfer: DealTransfer | null
  /** Status 1: the buyer's payment is in a block but not confirmed yet. */
  paying: DealTransfer | null
}

export const isConfirmed = (t: DealTransfer, tip: number): boolean =>
  tip - t.height >= MIN_CONFIRMATIONS

const latest = (list: DealTransfer[]): DealTransfer | null =>
  list.reduce<DealTransfer | null>((a, b) => (!a || b.height > a.height ? b : a), null)

export function dealState(chain: DealChain): DealState {
  const ok = (t: DealTransfer) => isConfirmed(t, chain.tip)
  const paidOk = chain.paid.filter(ok)
  const paid = Math.round(paidOk.reduce((sum, t) => sum + t.amount, 0) * 1e8) / 1e8
  const base = { paid, paying: null }
  // The seller's money first, as the old page decided when both existed.
  const sellerOk = chain.toSeller.filter(ok)
  if (sellerOk.length) return { ...base, status: '4a', transfer: latest(sellerOk) }
  const buyerOk = chain.toBuyer.filter(ok)
  if (buyerOk.length) return { ...base, status: '4b', transfer: latest(buyerOk) }
  if (chain.toSeller.length) return { ...base, status: '3a', transfer: latest(chain.toSeller) }
  if (chain.toBuyer.length) return { ...base, status: '3b', transfer: latest(chain.toBuyer) }
  if (paidOk.length) return { ...base, status: '2', transfer: latest(paidOk) }
  return { ...base, status: '1', transfer: null, paying: latest(chain.paid) }
}

export const isDealFinished = (status: DealStatus): boolean => status === '4a' || status === '4b'

/** Step of the four on the page: created, paid, the guarantor's transfer, finished. */
export const dealStep = (status: DealStatus): 1 | 2 | 3 | 4 =>
  status === '1' ? 1 : status === '2' ? 2 : status === '3a' || status === '3b' ? 3 : 4

export type DealRole = 'buyer' | 'seller' | 'validator'

/** My part in the deal; checked in the old order: buyer, seller, guarantor. */
export function dealRole(
  params: Pick<DealParams, 'buyer' | 'validator'>,
  seller: string | null | undefined,
  me: string | null | undefined
): DealRole | null {
  if (!me) return null
  if (me === params.buyer) return 'buyer'
  if (seller && me === seller) return 'seller'
  if (me === params.validator) return 'validator'
  return null
}

/**
 * Whose move it is (s7-dealmatrix, the frames): the buyer pays (1), the
 * seller does the deal and the guarantor decides (2), then whoever got the
 * money confirms it in the chat (4a — the seller, 4b — the buyer). Nobody's
 * while a transfer is on its way.
 */
export function isDealTurn(role: DealRole | null, status: DealStatus): boolean {
  switch (status) {
    case '1':
      return role === 'buyer'
    case '2':
      return role === 'seller' || role === 'validator'
    case '4a':
      return role === 'seller'
    case '4b':
      return role === 'buyer'
    default:
      return false
  }
}

/** The one who can send money now: the buyer at 1, the guarantor at 2. */
export const paysNow = (role: DealRole | null, status: DealStatus): boolean =>
  (role === 'buyer' && status === '1') || (role === 'validator' && status === '2')
