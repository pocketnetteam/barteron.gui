import { describe, expect, it } from 'vitest'
import { md5 } from '@/lib/md5'
import { BAN_LIST } from './ban-list'
import { hangIfBanned, isBanned, loadBanList, withoutBanned } from './ban'
import { GUARANTORS, isGuarantor, isModerator, MODERATORS, otherModerators } from './roles'

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{34}$/

/** Settles within a few ticks, or not at all. */
async function settles(promise: Promise<unknown>): Promise<boolean> {
  let done = false
  void promise.then(() => (done = true))
  await new Promise((r) => setTimeout(r, 20))
  return done
}

describe('the lists are the old app’s', () => {
  it('the ban list: the 691 production addresses of banUtils.js, in their order', () => {
    // md5 of the old list joined by \n (audit stage 8, `audit8-lists.mjs`).
    expect(BAN_LIST).toHaveLength(691)
    expect(md5(BAN_LIST.join('\n'))).toBe('5933311cbfa09cee3c3f2ab5bde72fc2')
    expect(new Set(BAN_LIST).size).toBe(691)
    expect(BAN_LIST.every((a) => BASE58.test(a) && a.startsWith('P'))).toBe(true)
  })

  it('guarantors and moderators: production then development, as in the old settings', () => {
    expect(GUARANTORS).toEqual([
      'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX',
      'PPbNqCweFnTePQyXWR21B9jXWCiDJa2yYu',
      'PMkhdDuCM3k8xLRDBUnmBDcUMWjhfPbWbE',
      'TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX',
      'THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V',
      'TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6',
      'TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733',
    ])
    expect(MODERATORS).toEqual([
      'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX',
      'PXYhCbTwPaUHrP6spJM5NY84TBpLQJtZi5',
      'TVABvVQKn6MaqXziDaUjW5afg9EcGdGQuX',
      'THC9eiAxFEA9TFv8jLCsoDuLNsa2gCmw6V',
      'TJmXy5Q4jgR6QzB7qmncFoURmVMBB95aL6',
      'TWEE5wJDL2EjR6iryH5mTyebDZWRbPZ733',
    ])
    for (const a of [...GUARANTORS, ...MODERATORS]) {
      expect(BASE58.test(a)).toBe(true)
      expect(BAN_LIST).not.toContain(a)
    }
  })

  it('roles compare the address exactly: base58 is case-sensitive', () => {
    const near = (a: string) => [a.toLowerCase(), a.toUpperCase(), ` ${a}`, `${a} `, a.slice(0, -1)]
    const g = GUARANTORS[1]!
    expect(isGuarantor(g)).toBe(true)
    for (const a of near(g)) expect(isGuarantor(a)).toBe(false)
    const m = MODERATORS[1]!
    expect(isModerator(m)).toBe(true)
    for (const a of near(m)) expect(isModerator(a)).toBe(false)
    expect(isGuarantor(null)).toBe(false)
    expect(isModerator('')).toBe(false)
    expect(isModerator(MODERATORS[1])).toBe(true)
    expect(otherModerators(MODERATORS[0]!)).not.toContain(MODERATORS[0])
    expect(otherModerators(MODERATORS[0]!)).toContain(MODERATORS[1])
  })
})

describe('the ban', () => {
  it('exact addresses only; lists drop banned authors and keep the rest', async () => {
    await loadBanList()
    const banned = BAN_LIST[5]!
    expect(isBanned(banned)).toBe(true)
    for (const near of [banned.toLowerCase(), ` ${banned}`, banned.slice(1), '', null, undefined]) {
      expect(isBanned(near)).toBe(false)
    }
    const items = [{ address: banned }, { address: GUARANTORS[0] }, { address: null }, {}]
    expect(withoutBanned(items)).toEqual([{ address: GUARANTORS[0] }, { address: null }, {}])
  })

  it('a banned address waits forever; anyone else goes on', async () => {
    expect(await settles(hangIfBanned(BAN_LIST[0]))).toBe(false)
    expect(await settles(hangIfBanned(GUARANTORS[0]))).toBe(true)
    expect(await settles(hangIfBanned(null))).toBe(true)
  })
})
