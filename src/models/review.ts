/**
 * Reviews and scores of an offer, as `getbarteronoffersdetails` returns them.
 *
 * - A review is a Bastyon comment (type 204) on the offer: `s1` author,
 *   `s3` offer id, `p.s1` JSON `{message, url, images, info}`
 *   (barteron.gui `src/js/models/comment.js`).
 * - A score is `upvoteShare` (type 300): `s1` author, `s2` offer id, `i1` 1–5
 *   (barteron.gui `src/js/models/offerScore.js`).
 *
 * Payloads for `sdk.barteron.comment` / `sdk.barteron.vote` follow the old
 * `setBrtComment` / `setBrtOfferVote`.
 */

import { isTxid, parseJsonObject, str, txTimeMs, type RawTx } from './tx'

export interface Review {
  hash: string
  /** Offer id. */
  offerId: string
  address: string
  parentId: string
  message: string
  /** The score given with the review, `"1"`–`"5"`; empty when none (old `votes` component). */
  info: string
  time: number
  height: number
}

export function parseReview(tx: RawTx, now = Date.now()): Review | null {
  if (!tx.hash) return null
  const msg = parseJsonObject(tx.p?.s1)
  return {
    hash: tx.hash,
    offerId: str(tx.s3),
    address: str(tx.s1),
    parentId: str(tx.s4),
    message: str(msg.message),
    info: str(msg.info),
    time: txTimeMs(tx.time, now),
    height: tx.height ?? 0,
  }
}

export interface OfferScore {
  hash: string
  offerId: string
  address: string
  /** 1–5. */
  value: number
  time: number
  height: number
}

export function parseScore(tx: RawTx, now = Date.now()): OfferScore | null {
  if (!tx.hash) return null
  const value = Number(tx.i1)
  return {
    hash: tx.hash,
    offerId: str(tx.s2),
    address: str(tx.s1),
    value: Number.isFinite(value) ? value : 0,
    time: txTimeMs(tx.time, now),
    height: tx.height ?? 0,
  }
}

export interface AverageScore {
  value: number
  count: number
}

/** Average of an offer's scores, skipping broken ones (old `getBrtAverageOfferScores`). */
export function averageScore(scores: readonly Pick<OfferScore, 'value'>[]): AverageScore {
  const values = scores.map((s) => s.value).filter((v) => Number.isFinite(v) && v > 0)
  const sum = values.reduce((acc, v) => acc + v, 0)
  return { value: values.length ? sum / values.length : 0, count: values.length }
}

/** Scores 1–3 need a moderator's permission; 4–5 users give themselves. */
export const MODERATED_SCORE_MAX = 3

export interface ReviewPayload {
  postid: string
  msgparsed: { message: string; info: string }
  parentid?: string
  answerid?: string
}

/** `score` goes to `info` as the old app wrote it: `score.toFixed()`. */
export function toReviewPayload(
  offerId: string,
  message: string,
  score?: number,
  parentId = ''
): ReviewPayload {
  const info = score ? score.toFixed() : ''
  if (!isTxid(offerId)) throw new Error('review:invalid:postid')
  if (!message.trim()) throw new Error('review:invalid:message')
  return {
    postid: offerId,
    msgparsed: { message, info },
    ...(parentId && { parentid: parentId }),
  }
}

export interface VotePayload {
  share: string
  /** Offer author: the score goes to their rating. */
  vsaddress: string
  value: number
}

export function toVotePayload(offerId: string, author: string, value: number): VotePayload {
  if (!isTxid(offerId)) throw new Error('vote:invalid:share')
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new Error('vote:invalid:value')
  return { share: offerId, vsaddress: author, value }
}
