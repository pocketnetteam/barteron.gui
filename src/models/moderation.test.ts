import { describe, expect, it } from 'vitest'
import { emptyAccount, type BarteronAccount } from './account'
import {
  findDecision,
  findRequest,
  moderationPath,
  parseModerationQuery,
  pickModerator,
  withDecision,
  withRequest,
} from './moderation'

const OFFER = 'a'.repeat(64)
const USER = 'PUser11111111111111111111111111111'
const MOD = 'PMod111111111111111111111111111111'
const NOW = 1_800_000_000_000
const DAY = 24 * 3600 * 1000

const account = (address: string, voting: Record<string, unknown>): BarteronAccount => ({
  ...emptyAccount(address),
  metaData: { votingModeration: voting },
})

describe('moderation link', () => {
  it('keeps the old parameters and adds the reason', () => {
    expect(moderationPath({ offer: OFFER, user: USER, score: 2, reason: null })).toBe(
      `barter/moderation?offer=${OFFER}&user=${USER}&score=2`
    )
    const path = moderationPath({ offer: OFFER, user: USER, score: 1, reason: 'Колесо погнуто' })
    expect(
      parseModerationQuery(Object.fromEntries(new URLSearchParams(path.split('?')[1])))
    ).toEqual({ offer: OFFER, user: USER, score: 1, reason: 'Колесо погнуто' })
  })

  it('cuts a long reason: the chat has all of it', () => {
    const path = moderationPath({ offer: OFFER, user: USER, score: 1, reason: 'я'.repeat(500) })
    const reason = new URLSearchParams(path.split('?')[1]).get('reason')!
    expect(reason).toHaveLength(300)
    expect(reason.endsWith('…')).toBe(true)
  })

  it('takes only low scores and a real offer id', () => {
    expect(parseModerationQuery({ offer: OFFER, user: USER, score: '4' })).toBeNull()
    expect(parseModerationQuery({ offer: OFFER, user: USER, score: '0' })).toBeNull()
    expect(parseModerationQuery({ offer: 'x', user: USER, score: '2' })).toBeNull()
    expect(parseModerationQuery({ offer: OFFER, user: '', score: '2' })).toBeNull()
  })
})

describe('decisions and requests', () => {
  it('finds the latest decision of any moderator within a week', () => {
    const a = account(MOD, {
      accessItems: [
        {
          createdAt: NOW - 3 * DAY,
          offerId: OFFER,
          userAddress: USER,
          score: 2,
          status: 'rejected',
        },
        { createdAt: NOW - DAY, offerId: OFFER, userAddress: USER, score: 3, status: 'allowed' },
        {
          createdAt: NOW - DAY,
          offerId: OFFER,
          userAddress: 'POther',
          score: 1,
          status: 'allowed',
        },
      ],
    })
    expect(findDecision([a], OFFER, USER, NOW)).toEqual({
      status: 'allowed',
      score: 3,
      createdAt: NOW - DAY,
      moderator: MOD,
    })
    // Older than a week: gone, as the old model dropped them.
    expect(findDecision([a], OFFER, USER, NOW + 7 * DAY)).toBeNull()
  })

  it('finds my request, old ones without score and moderator too', () => {
    const me = account(USER, {
      requestItems: [{ createdAt: NOW - DAY, offerId: OFFER }],
    })
    expect(findRequest(me, OFFER, NOW)).toEqual({
      createdAt: NOW - DAY,
      score: null,
      moderator: null,
    })
    expect(findRequest(me, 'b'.repeat(64), NOW)).toBeNull()
  })

  it('adds items and keeps the rest of the profile', () => {
    const me = account(USER, { moderator: { status: 'available' } })
    const next = withRequest(me, { offerId: OFFER, score: 2, moderator: MOD }, NOW)
    expect(next.metaData.votingModeration).toEqual({
      moderator: { status: 'available' },
      requestItems: [{ createdAt: NOW, offerId: OFFER, score: 2, moderator: MOD }],
    })
    const decided = withDecision(
      account(MOD, {}),
      { offerId: OFFER, userAddress: USER, score: 2, status: 'allowed' },
      NOW
    )
    expect(findDecision([decided], OFFER, USER, NOW)?.status).toBe('allowed')
  })

  it('picks a moderator on duty who is not me', () => {
    const on = account(MOD, { moderator: { status: 'available' } })
    const off = account('POff', { moderator: { status: 'unavailable' } })
    const self = account(USER, { moderator: { status: 'available' } })
    expect(pickModerator([on, off, self], USER, () => 0.99)).toBe(MOD)
    expect(pickModerator([off, self], USER)).toBeNull()
  })
})
