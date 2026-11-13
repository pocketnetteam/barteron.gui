import { describe, expect, it } from 'vitest'
import { parseUserProfile } from './profile'

/*
 * Rows of `getuserprofile [addresses] '1'` as mainnet answers them (keys and
 * types checked on 12 Barteron sellers, 13.11.2026); names and avatars made up.
 */
const ADDRESS = 'PXYhCbTwPaUHrP6spJM5NY84TBpLQJtZi5'
const ROW = {
  hash: 'e'.repeat(64),
  address: ADDRESS,
  id: 1234567,
  name: 'Анна К.',
  i: 'https://peertube160.pocketnet.app/images/avatar.jpg',
  b: '',
  r: '',
  postcnt: 3,
  dltdcnt: 0,
  reputation: 9.3,
  subscribes_count: 1,
  subscribers_count: 2,
  blockings_count: 0,
  blockers_count: 0,
  likers_count: 0,
  k: '',
  a: 'О себе',
  l: 'ru',
  s: '',
  update: 1_727_385_735,
  regdate: 1_727_385_735,
  flags: {},
  firstFlags: {},
  actions: 0,
  bans: {},
  badges: [],
}

describe('parseUserProfile', () => {
  it('a Bastyon profile: name, avatar, language, registration in ms', () => {
    expect(parseUserProfile(ROW)).toEqual({
      address: ADDRESS,
      name: 'Анна К.',
      image: 'https://peertube160.pocketnet.app/images/avatar.jpg',
      language: 'ru',
      about: 'О себе',
      regdate: 1_727_385_735_000,
      reputation: 9.3,
    })
  })

  it('a deleted Bastyon account still has a Barteron profile: no name, nothing to show', () => {
    // Mainnet answers it like this; the screens show a short address instead.
    const deleted = { hash: 'f'.repeat(64), address: ADDRESS, id: 7654321, deleted: true }
    expect(parseUserProfile(deleted)).toEqual({
      address: ADDRESS,
      name: '',
      image: '',
      language: '',
      about: '',
      regdate: null,
      reputation: 0,
    })
  })

  it('odd values from a node do not leak through', () => {
    const odd = { ...ROW, name: 5, i: null, regdate: 0, reputation: '9' }
    expect(parseUserProfile(odd)).toMatchObject({
      name: '',
      image: '',
      regdate: null,
      reputation: 0,
    })
    expect(parseUserProfile({ ...ROW, regdate: -1 })?.regdate).toBeNull()
  })

  it('a row without an address is no profile', () => {
    expect(parseUserProfile({ ...ROW, address: '' })).toBeNull()
    expect(parseUserProfile({ name: 'x' })).toBeNull()
  })
})
