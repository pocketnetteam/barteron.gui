import { describe, expect, it } from 'vitest'
import { serializeAccount } from '@/test/legacy-tx'
import MAINNET_ACCOUNTS from '@/test/mainnet-accounts.json'
import {
  accountFromAlias,
  canLeaveModeration,
  emptyAccount,
  freshVotingModeration,
  guarantorState,
  isValidGuarantorFee,
  moderatorAvailable,
  parseAccount,
  toAccountPayload,
  VOTING_MODERATION_TTL,
  withGuarantor,
  withModerator,
  type AccountSafeDeal,
  type VotingModerationItem,
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

  it('a broken or missing s4 gives an empty profile of that address, not a crash', () => {
    for (const p of [{ s4: '{"a":[1' }, { s4: '[1,2]' }, {}, undefined]) {
      const account = parseAccount({ hash: 'b'.repeat(64), type: 104, time: 1, s1: ADDRESS, p })
      expect(account).toMatchObject({
        address: ADDRESS,
        hash: 'b'.repeat(64),
        tags: [],
        geohash: '',
        static: false,
        radius: 0,
        safeDeal: {},
        metaData: {},
      })
    }
  })

  it('odd values: numeric strings in the list count, junk does not', () => {
    const s4 = JSON.stringify({
      a: ['5', 7, null, 'x', {}, true, 2.5],
      g: 42,
      s: 'true',
      r: '10',
      d: [1],
      m: 'x',
    })
    const account = parseAccount({
      hash: 'c'.repeat(64),
      type: 104,
      time: 1,
      s1: ADDRESS,
      p: { s4 },
    })
    expect(account).toMatchObject({
      tags: [5, 7, 2.5],
      geohash: '',
      // Only a real `true`: the app never writes anything else.
      static: false,
      radius: 0,
      safeDeal: {},
      metaData: {},
    })
    const fixed = parseAccount({
      hash: 'c'.repeat(64),
      type: 104,
      time: 1,
      s1: ADDRESS,
      p: { s4: '{"a":[],"g":"u33dc0","s":true,"r":25,"d":{},"m":{}}' },
    })
    expect(fixed).toMatchObject({ geohash: 'u33dc0', static: true, radius: 25 })
  })

  it('what the node adds: no regdate or a zero one is unknown, not 1970', () => {
    const tx = { hash: 'd'.repeat(64), type: 104, time: 1, s1: ADDRESS, p: { s4: S4 } }
    expect(parseAccount(tx)).toMatchObject({ regdate: null, rating: 0, ratingCount: 0 })
    expect(parseAccount({ ...tx, additional: { regdate: 0 } }).regdate).toBeNull()
    expect(parseAccount({ ...tx, additional: { regdate: 1 } }).regdate).toBe(1000)
  })
})

describe('mainnet profiles of 2024–2026', () => {
  it.each(MAINNET_ACCOUNTS.map((a) => [a.about, a.tx] as const))(
    '%s: sent back unchanged, it is the transaction the old app would write',
    (_about, raw) => {
      const account = parseAccount(raw)
      expect(account.address).toBe(raw.s1)
      expect(account.hash).toBe(raw.hash)
      expect(account.time).toBe(raw.time * 1000)
      // The old Account: every missing key becomes its default, `d` and `m` — `{}`.
      const { a, g, s, r, d, m } = JSON.parse(raw.p.s4)
      const old = JSON.stringify({ a, g, s, r, d: d ?? {}, m: m ?? {} })
      expect(serializeAccount(raw.s1, { ...toAccountPayload(account) })).toBe(raw.s1 + old)
      expect(account.ratingCount).toBe(raw.additional.rating_count)
      // The node keeps the average times ten, cut down to a whole number.
      if (raw.additional.rating_count) {
        const average = raw.additional.rating_sum / raw.additional.rating_count
        expect(account.rating).toBe(Math.floor(average * 10) / 10)
      }
    }
  )

  it('reads the guarantors as the old profile page did', () => {
    const [off, on] = MAINNET_ACCOUNTS.slice(-2).map((a) => parseAccount(a.tx))
    expect(guarantorState(off!, 5)).toEqual({ available: false, feePercent: 2 })
    expect(guarantorState(on!, 5)).toEqual({ available: true, feePercent: 2 })
    // Neither mainnet moderator has ever gone on duty: there is no votingModeration.
    expect(MAINNET_ACCOUNTS.map((a) => moderatorAvailable(parseAccount(a.tx)))).not.toContain(true)
  })
})

describe('voting moderation', () => {
  it('a week to the millisecond: an item made exactly a week ago is gone', () => {
    const now = Date.UTC(2026, 10, 10)
    const edge = { createdAt: now - VOTING_MODERATION_TTL }
    const inside = { createdAt: now - VOTING_MODERATION_TTL + 1 }
    const meta = freshVotingModeration(
      // What a node may hold: the chain does not check types.
      {
        votingModeration: {
          requestItems: [edge, inside, null, {}, { createdAt: '1' }] as VotingModerationItem[],
        },
      },
      now
    )
    expect(meta.votingModeration).toEqual({ requestItems: [inside] })
  })

  it('a profile without moderation stays as it is', () => {
    const meta = { other: 1 }
    expect(freshVotingModeration(meta)).toBe(meta)
    expect(freshVotingModeration({ votingModeration: { moderator: {} } })).toEqual({
      votingModeration: { moderator: {} },
    })
  })

  it('drops requests and grants older than a week, like the old model', () => {
    const now = Date.UTC(2026, 10, 10)
    const fresh = { createdAt: now - 1000 }
    const old = { createdAt: now - VOTING_MODERATION_TTL - 1 }
    const meta = freshVotingModeration(
      {
        votingModeration: {
          moderator: { status: 'available' },
          requestItems: [fresh, old],
          accessItems: [old],
        },
      },
      now
    )
    expect(meta.votingModeration).toEqual({
      moderator: { status: 'available' },
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

  it('a key the host left out (null from the new host, missing from the old) keeps the known value', () => {
    const base = {
      ...emptyAccount(ADDRESS),
      tags: [1],
      geohash: 'u33',
      static: true,
      radius: 5,
      safeDeal: { validator: { status: 'available' } },
      metaData: { other: 1 },
    }
    const blank = {
      address: ADDRESS,
      tags: null,
      geohash: null,
      static: null,
      radius: null,
      safeDeal: null,
      metaData: null,
    }
    expect(accountFromAlias(blank, base)).toEqual(base)
    expect(accountFromAlias({ address: ADDRESS }, base)).toEqual(base)
  })

  it('every field the host sends replaces the known one', () => {
    const alias = {
      address: ADDRESS,
      tags: [],
      geohash: '',
      static: false,
      radius: 0,
      safeDeal: { validator: { feePercent: 3 } },
      metaData: { votingModeration: {} },
    }
    const base = { ...emptyAccount(ADDRESS), tags: [1], geohash: 'u', static: true, radius: 9 }
    expect(accountFromAlias(alias, base)).toMatchObject({ ...alias, rating: 0 })
    // No profile known yet: the host copy over an empty one.
    expect(accountFromAlias(alias, null)).toMatchObject({ ...alias, hash: null })
  })
})

describe('roles kept in the profile', () => {
  it('guarantor: status and fee in safeDeal.validator, other keys stay', () => {
    const base = { ...emptyAccount(ADDRESS), safeDeal: { extra: 1, validator: { note: 'x' } } }
    expect(guarantorState(base, 5)).toEqual({ available: false, feePercent: 5 })
    const next = withGuarantor(base, { available: true, feePercent: 2 })
    expect(next.safeDeal).toEqual({
      extra: 1,
      validator: { note: 'x', status: 'available', feePercent: 2 },
    })
    expect(guarantorState(next, 5)).toEqual({ available: true, feePercent: 2 })
    expect(toAccountPayload(next).safeDeal).toEqual(next.safeDeal)
  })

  it('a zero, negative or junk fee shows the default one, as the old page did', () => {
    const fee = (feePercent: unknown) =>
      guarantorState(
        { ...emptyAccount(ADDRESS), safeDeal: { validator: { feePercent } } as AccountSafeDeal },
        5
      ).feePercent
    expect([0, -1, 'x', null, undefined, '3', 2.5].map(fee)).toEqual([5, 5, 5, 5, 5, 3, 2.5])
  })

  it('fee: 1 to 98, as the old form checked', () => {
    expect([0, 1, 50.5, 98, 99, NaN].map(isValidGuarantorFee)).toEqual([
      false,
      true,
      true,
      true,
      false,
      false,
    ])
  })

  it('moderator: status in votingModeration, requests stay', () => {
    const base = {
      ...emptyAccount(ADDRESS),
      metaData: {
        other: true,
        votingModeration: { requestItems: [{ createdAt: 1 }], moderator: { note: 'x' } },
      },
    }
    const on = withModerator(base, true)
    expect(moderatorAvailable(on)).toBe(true)
    expect(on.metaData).toEqual({
      other: true,
      votingModeration: {
        requestItems: [{ createdAt: 1 }],
        moderator: { note: 'x', status: 'available' },
      },
    })
    expect(moderatorAvailable(withModerator(on, false))).toBe(false)
  })

  it('a moderator leaves only while someone else is on duty', () => {
    const off = emptyAccount('PA')
    const on = withModerator(emptyAccount('PB'), true)
    expect(canLeaveModeration([off])).toBe(false)
    expect(canLeaveModeration([off, on])).toBe(true)
  })
})
