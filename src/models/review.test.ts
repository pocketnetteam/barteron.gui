import { describe, expect, it } from 'vitest'
import mainnet from '@/test/mainnet-reviews.json'
import {
  averageScore,
  parseReview,
  parseScore,
  REVIEW_MAX_LENGTH,
  toReviewPayload,
  toVotePayload,
} from './review'
import { TX_TYPE, type RawTx } from './tx'

const OFFER = 'c'.repeat(64)

describe('mainnet reviews and scores (13.11.2026)', () => {
  it.each(mainnet.comments.map((c) => [JSON.parse(c.p.s1).info, c] as const))(
    'a review with info «%s» reads, and the same review goes out as the old app sent it',
    (info, raw) => {
      const review = parseReview(raw as RawTx)!
      const msg = JSON.parse(raw.p.s1)
      expect(review).toMatchObject({
        hash: raw.hash,
        offerId: raw.s3,
        address: raw.s1,
        parentId: '',
        message: msg.message,
        info,
        time: raw.time * 1000,
        height: raw.height,
      })
      const score = Number(info) || undefined
      expect(toReviewPayload(raw.s3, review.message, score)).toEqual({
        postid: raw.s3,
        msgparsed: { message: msg.message, info: msg.info },
      })
    }
  )

  it('scores read with their value; the average is plain', () => {
    const scores = mainnet.offerScores.map((s) => parseScore(s as RawTx)!)
    expect(scores.map((s) => s.value)).toEqual([1, 3, 4, 5])
    expect(scores.map((s) => s.offerId)).toEqual(mainnet.offerScores.map((s) => s.s2))
    expect(scores.map((s) => s.address)).toEqual(mainnet.offerScores.map((s) => s.s1))
    expect(averageScore(scores)).toEqual({ value: 13 / 4, count: 4 })
  })
})

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

  it('a review without a score says «0», as the old app wrote it (139 of 180 on mainnet)', () => {
    expect(toReviewPayload(OFFER, 'Спасибо').msgparsed.info).toBe('0')
    expect(toReviewPayload(OFFER, 'Спасибо', 0).msgparsed.info).toBe('0')
    expect(toReviewPayload(OFFER, 'Ответ', undefined, 'd'.repeat(64))).toEqual({
      postid: OFFER,
      msgparsed: { message: 'Ответ', info: '0' },
      parentid: 'd'.repeat(64),
    })
  })

  it('no empty review, and none longer than both hosts take (915)', () => {
    expect(() => toReviewPayload(OFFER, '  \n')).toThrow('review:invalid:message')
    expect(REVIEW_MAX_LENGTH).toBe(915)
    expect(toReviewPayload(OFFER, 'я'.repeat(915)).msgparsed.message).toHaveLength(915)
    expect(() => toReviewPayload(OFFER, 'я'.repeat(916))).toThrow('review:invalid:length')
  })

  it('a score is a whole 1–5', () => {
    for (const bad of [0, 3.5, -1, NaN]) {
      expect(() => toVotePayload(OFFER, 'PAuthor', bad)).toThrow('vote:invalid:value')
    }
    expect(toVotePayload(OFFER, 'PAuthor', 1).value).toBe(1)
    expect(toVotePayload(OFFER, 'PAuthor', 5).value).toBe(5)
    expect(() => toVotePayload('x', 'PAuthor', 5)).toThrow('vote:invalid:share')
  })

  it('broken records: no hash — dropped; broken text or score — empty, not a crash', () => {
    // What a node could send, whatever the type says.
    const raw = (tx: object) => tx as RawTx
    expect(parseReview(raw({ s1: 'P1', s3: OFFER }))).toBeNull()
    expect(parseScore(raw({ s1: 'P1', s2: OFFER, i1: 5 }))).toBeNull()
    expect(
      parseReview(
        raw({ hash: 'r'.repeat(64), s1: 'P1', s3: OFFER, s4: 'p'.repeat(64), p: { s1: '{' } })
      )
    ).toMatchObject({ message: '', info: '', parentId: 'p'.repeat(64), height: 0 })
    expect(parseScore(raw({ hash: 's'.repeat(64), s1: 'P1', s2: OFFER, i1: '4' }))?.value).toBe(4)
    expect(parseScore(raw({ hash: 's'.repeat(64), s1: 'P1', s2: OFFER, i1: 'x' }))?.value).toBe(0)
    expect(averageScore([{ value: 0 }, { value: Infinity }, { value: 3 }])).toEqual({
      value: 3,
      count: 1,
    })
  })
})
