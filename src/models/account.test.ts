import { describe, expect, it } from 'vitest'
import { serializeAccount } from '@/test/legacy-tx'
import {
  accountFromAlias,
  emptyAccount,
  freshVotingModeration,
  parseAccount,
  toAccountPayload,
  VOTING_MODERATION_TTL,
} from './account'
import { TX_TYPE } from './tx'

/*
 * A real Barteron profile from mainnet (brtaccount 39b4f348…), from
 * bastyon-nextgen `legacy-objects.test.ts`. It was written by an old app
 * version without metadata, so `p.s4` has no `m`.
 */
const ADDRESS = 'PMQdinb6TKLYvj779MtPVTzwHUB3KbJSy7'
const S4 = '{"a":[11116,23],"g":"","s":false,"r":0,"d":{}}'

describe('parseAccount', () => {
  it('reads the mainnet profile and the rating the node adds', () => {
    const account = parseAccount({
      hash: '39b4f348' + '0'.repeat(56),
      type: TX_TYPE.account,
      height: 3_000_000,
      time: 1_720_000_000,
      s1: ADDRESS,
      p: { s4: S4 },
      additional: { regdate: 1_700_000_000, rating: 46, rating_sum: 23, rating_count: 5 },
    })
    expect(account).toMatchObject({
      address: ADDRESS,
      tags: [11116, 23],
      geohash: '',
      static: false,
      radius: 0,
      safeDeal: {},
      metaData: {},
      regdate: 1_700_000_000_000,
      // The node keeps it multiplied by ten.
      rating: 4.6,
      ratingSum: 23,
      ratingCount: 5,
    })
  })

  it('a profile sent back unchanged serialises as the current old app does (with "m":{})', () => {
    const account = parseAccount({
      hash: 'a'.repeat(64),
      type: 104,
      time: 1,
      s1: ADDRESS,
      p: { s4: S4 },
    })
    expect(serializeAccount(ADDRESS, { ...toAccountPayload(account) })).toBe(
      ADDRESS + '{"a":[11116,23],"g":"","s":false,"r":0,"d":{},"m":{}}'
    )
  })

  it('payload holds only the fields the hosts read', () => {
    expect(Object.keys(toAccountPayload(emptyAccount(ADDRESS))).sort()).toEqual(
      ['address', 'geohash', 'metaData', 'radius', 'safeDeal', 'static', 'tags'].sort()
    )
  })
})

describe('voting moderation', () => {
  it('drops requests and grants older than a week, like the old model', () => {
    const now = Date.UTC(2026, 10, 10)
    const fresh = { createdAt: now - 1000 }
    const old = { createdAt: now - VOTING_MODERATION_TTL - 1 }
    const meta = freshVotingModeration(
      { votingModeration: { moderator: 'PMod', requestItems: [fresh, old], accessItems: [old] } },
      now
    )
    expect(meta.votingModeration).toEqual({
      moderator: 'PMod',
      requestItems: [fresh],
      accessItems: [],
    })
  })
})

describe('accountFromAlias', () => {
  it('a profile on its way: the host copy over what is known', () => {
    const base = { ...emptyAccount(ADDRESS), rating: 4.5, tags: [1] }
    const pending = accountFromAlias(
      { address: ADDRESS, tags: [2, 3], geohash: 'u', static: true },
      base
    )
    expect(pending).toMatchObject({ tags: [2, 3], geohash: 'u', static: true, rating: 4.5 })
    expect(accountFromAlias({ tags: [] }, base)).toBeNull()
  })
})
