/**
 * Moderation of low scores (old `votes` and `VotingModeration`). Scores
 * 1–3 need a moderator's permission. Nothing is stored outside Barteron
 * profiles (tx 104, `metaData.votingModeration`):
 *
 * - the user's profile gets a request `{createdAt, offerId}` — new versions
 *   add `score` and `moderator`, the old app ignores them;
 * - the moderator's profile gets the decision `{createdAt, offerId,
 *   userAddress, score, status: allowed | rejected}`.
 *
 * Both live a week. The request itself — the reason and the link
 * `barter/moderation?offer=…&user=…&score=…` — goes to the moderator in a
 * chat. New links add `reason`, so the moderator sees it on the page too.
 */

import { isJsonObject } from './tx'
import {
  moderatorAvailable,
  VOTING_MODERATION_TTL,
  type BarteronAccount,
  type VotingModerationItem,
} from './account'

/** Scores below this need a moderator. */
export const LOW_SCORE_LIMIT = 4

/** The reason travels in the link only this long; the chat has all of it. */
export const REASON_IN_LINK = 300

export interface ModerationRef {
  offer: string
  user: string
  /** 1–3. */
  score: number
  reason: string | null
}

const first = (value: unknown): string => {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' ? v.trim() : ''
}

export function parseModerationQuery(query: Record<string, unknown>): ModerationRef | null {
  const offer = first(query.offer)
  const user = first(query.user)
  const score = Number(first(query.score))
  if (!/^[0-9a-f]{64}$/i.test(offer) || !user) return null
  if (!Number.isInteger(score) || score < 1 || score >= LOW_SCORE_LIMIT) return null
  return { offer, user, score, reason: first(query.reason) || null }
}

/** Path for `applink`, in the old order: offer, user, score — then the reason. */
export function moderationPath(ref: ModerationRef): string {
  const query: Record<string, string> = {
    offer: ref.offer,
    user: ref.user,
    score: String(ref.score),
  }
  const reason = ref.reason?.trim()
  if (reason) {
    query.reason =
      reason.length > REASON_IN_LINK ? `${reason.slice(0, REASON_IN_LINK - 1)}…` : reason
  }
  return `barter/moderation?${new URLSearchParams(query).toString()}`
}

const fresh = (item: VotingModerationItem, now: number) =>
  typeof item.createdAt === 'number' && item.createdAt > now - VOTING_MODERATION_TTL

const items = (account: BarteronAccount, key: 'accessItems' | 'requestItems') => {
  const list = account.metaData.votingModeration?.[key]
  return Array.isArray(list) ? list.filter(isJsonObject) : []
}

export interface ModeratorDecision {
  status: 'allowed' | 'rejected'
  score: number
  createdAt: number
  /** Who decided. */
  moderator: string
}

/**
 * The latest decision about this user and offer among the moderators'
 * profiles, younger than a week (old `findAccessData`).
 */
export function findDecision(
  moderators: readonly BarteronAccount[],
  offer: string,
  user: string,
  now = Date.now()
): ModeratorDecision | null {
  let found: ModeratorDecision | null = null
  for (const account of moderators) {
    for (const item of items(account, 'accessItems')) {
      if (!fresh(item, now) || item.offerId !== offer || item.userAddress !== user) continue
      if (item.status !== 'allowed' && item.status !== 'rejected') continue
      if (found && found.createdAt > (item.createdAt as number)) continue
      found = {
        status: item.status,
        score: Number(item.score) || 0,
        createdAt: item.createdAt as number,
        moderator: account.address,
      }
    }
  }
  return found
}

export interface ModerationRequest {
  createdAt: number
  score: number | null
  moderator: string | null
}

/** My latest request for this offer, younger than a week (old `findRequestData`). */
export function findRequest(
  account: BarteronAccount | null | undefined,
  offer: string,
  now = Date.now()
): ModerationRequest | null {
  if (!account) return null
  const list = items(account, 'requestItems').filter(
    (item) => fresh(item, now) && item.offerId === offer
  )
  const last = list.at(-1)
  if (!last) return null
  return {
    createdAt: last.createdAt as number,
    score: typeof last.score === 'number' ? last.score : null,
    moderator: typeof last.moderator === 'string' ? last.moderator : null,
  }
}

const withItem = (
  account: BarteronAccount,
  key: 'accessItems' | 'requestItems',
  item: VotingModerationItem
): BarteronAccount => {
  const voting = isJsonObject(account.metaData.votingModeration)
    ? account.metaData.votingModeration
    : {}
  return {
    ...account,
    metaData: {
      ...account.metaData,
      votingModeration: { ...voting, [key]: [...items(account, key), item] },
    },
  }
}

/** My profile with a new request (old `submitModerationRequest`). */
export const withRequest = (
  account: BarteronAccount,
  request: { offerId: string; score: number; moderator: string },
  now = Date.now()
): BarteronAccount => withItem(account, 'requestItems', { createdAt: now, ...request })

/** The moderator's profile with a decision (old `VotingModeration` `execute`). */
export const withDecision = (
  account: BarteronAccount,
  decision: { offerId: string; userAddress: string; score: number; status: 'allowed' | 'rejected' },
  now = Date.now()
): BarteronAccount => withItem(account, 'accessItems', { createdAt: now, ...decision })

/** A moderator on duty, not me, at random (old `getRandomModerator`). */
export function pickModerator(
  accounts: readonly BarteronAccount[],
  me: string | null,
  random = Math.random
): string | null {
  const onDuty = accounts.filter((a) => a.address !== me && moderatorAvailable(a))
  return onDuty.length ? onDuty[Math.floor(random() * onDuty.length)]!.address : null
}
