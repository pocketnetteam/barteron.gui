import { describe, expect, it } from 'vitest'
import { averageScore, parseReview, parseScore, toReviewPayload, toVotePayload } from './review'
import { parseUserProfile } from './profile'
import { TX_TYPE } from './tx'

const OFFER = 'c'.repeat(64)

describe('reviews and scores', () => {
  it('reads a review: offer id in s3, text and score in p.s1', () => {
    const review = parseReview({
      hash: 'r'.repeat(64),
      type: TX_TYPE.comment,
      time: 1_700_000_000,
      height: 10,
      s1: 'PAuthor',
      s3: OFFER,
      p: { s1: '{"message":"Отлично","url":"","images":[],"info":"5"}' },
    })
    expect(review).toMatchObject({
      offerId: OFFER,
      address: 'PAuthor',
      message: 'Отлично',
      info: '5',
      time: 1_700_000_000_000,
    })
  })

  it('reads a score and averages the valid ones', () => {
    const score = parseScore({
      hash: 's'.repeat(64),
      type: 300,
      time: 1,
      s1: 'P1',
      s2: OFFER,
      i1: 4,
    })
    expect(score).toMatchObject({ offerId: OFFER, address: 'P1', value: 4 })
    expect(averageScore([{ value: 5 }, { value: 4 }, { value: NaN }])).toEqual({
      value: 4.5,
      count: 2,
    })
    expect(averageScore([])).toEqual({ value: 0, count: 0 })
  })

  it('payloads as the old app sent them', () => {
    expect(toReviewPayload(OFFER, 'Отлично', 5)).toEqual({
      postid: OFFER,
      msgparsed: { message: 'Отлично', info: '5' },
    })
    expect(toVotePayload(OFFER, 'PAuthor', 4)).toEqual({
      share: OFFER,
      vsaddress: 'PAuthor',
      value: 4,
    })
    expect(() => toVotePayload(OFFER, 'PAuthor', 6)).toThrow('vote:invalid:value')
    expect(() => toReviewPayload('nope', 'x')).toThrow('review:invalid:postid')
  })
})

describe('parseUserProfile', () => {
  it('name and avatar from the short getuserprofile answer', () => {
    expect(
      parseUserProfile({
        address: 'P1',
        name: 'Анна',
        i: 'https://x/i.png',
        regdate: 1_600_000_000,
      })
    ).toMatchObject({
      address: 'P1',
      name: 'Анна',
      image: 'https://x/i.png',
      regdate: 1_600_000_000_000,
    })
    expect(parseUserProfile({ name: 'no address' })).toBeNull()
  })
})
