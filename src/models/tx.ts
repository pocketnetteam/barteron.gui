/**
 * Transactions as the node returns them: pocketnet.core
 * `src/pocketdb/web/WebRpcUtils.cpp`, `ConstructTransaction`. Every Barteron
 * read (`getbarteronfeed`, `getbarteronaccounts`, …) answers with these.
 *
 * Empty fields are left out by the node, so every string may be missing.
 */
export interface RawTxPayload {
  s1?: string
  s2?: string
  s3?: string
  s4?: string
  s5?: string
  s6?: string
  s7?: string
  i1?: number
}

export interface RawTx {
  /** This version's txid. */
  hash: string
  type: number
  /** Missing while the transaction waits in the mempool. */
  height?: number
  blockHash?: string
  /** Unix time, seconds. */
  time: number
  s1?: string
  s2?: string
  s3?: string
  s4?: string
  s5?: string
  i1?: number
  p?: RawTxPayload
}

/** Transaction types Barteron reads and writes (pocketnet.core `TxType`). */
export const TX_TYPE = {
  /** Barteron profile, `brtaccount`. */
  account: 104,
  comment: 204,
  commentEdit: 205,
  commentDelete: 206,
  /** Removing an offer, `contentDelete`. */
  contentDelete: 207,
  /** Barteron offer, `brtoffer`. */
  offer: 211,
  /** Offer score, `upvoteShare`. */
  score: 300,
} as const

export type JsonObject = Record<string, unknown>

export function isJsonObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** `JSON.parse` that never throws: broken JSON on chain should not break a page. */
export function parseJson(text: string | undefined | null): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export function parseJsonObject(text: string | undefined | null): JsonObject {
  const value = parseJson(text)
  return isJsonObject(value) ? value : {}
}

export const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

export const objectOr = <T extends JsonObject>(value: unknown, fallback: T): T =>
  isJsonObject(value) ? (value as T) : fallback

const TXID = /^[0-9a-f]{64}$/i

export const isTxid = (value: unknown): value is string =>
  typeof value === 'string' && TXID.test(value)

/**
 * Transaction time in milliseconds. The node sends seconds; the old models
 * also accepted milliseconds and, for a missing time, used «now».
 */
export function txTimeMs(time: unknown, now = Date.now()): number {
  const value = typeof time === 'string' ? Number(time) : time
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return now
  // Seconds stay far below 1e11 until the year 5138.
  return value < 1e11 ? value * 1000 : value
}
