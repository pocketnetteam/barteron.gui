import { describe, expect, it } from 'vitest'
import { exchangeMessages, purchaseMessages } from '@/composables/chat'
import { fittingOffers } from '@/composables/may-match'
import { operationOf } from '@/composables/offer-actions'
import { formatDate, formatMonthYear } from '@/lib/format'
import { CategoryTree } from '@/models/categories'
import { emptyOffer, type Offer } from '@/models/offer'
import { dueForRenewal, RENEW_REMIND_DAYS } from '@/stores/autorenew'
import type { TrackedTx } from '@/stores/tx'
import { gallerySlides, parseVideoInfo } from './gallery'

const applink = (path: string) =>
  `https://bastyon.com/application?id=barteron.pocketnet.app&p=${path}`
const t = (key: string) => `[${key}]`
const H = (c: string) => c.repeat(64)

describe("chat messages: the old app's order", () => {
  it('exchange: my offer, theirs, then the phrase', () => {
    expect(exchangeMessages(applink, H('a'), H('b'), t)).toEqual([
      applink(`barter/${H('a')}`),
      applink(`barter/${H('b')}`),
      '[chatMessage.exchangeProposed]',
    ])
  })

  it('purchase: the offer, then the way; a pickup point adds its own link first', () => {
    expect(purchaseMessages(applink, H('a'), null, t)).toEqual([applink(`barter/${H('a')}`)])
    expect(purchaseMessages(applink, H('a'), { way: 'selfPickup' }, t)).toEqual([
      applink(`barter/${H('a')}`),
      '[chatMessage.selfPickup]',
    ])
    expect(purchaseMessages(applink, H('a'), { way: 'pickupPoint', id: H('c') }, t)).toEqual([
      applink(`barter/${H('a')}`),
      applink(`barter/${H('c')}`),
      '[chatMessage.pickupPoint]',
    ])
  })
})

const NOW = Date.UTC(2026, 10, 10)
const DAY = 24 * 3600 * 1000
const offer = (patch: Partial<Offer>): Offer => ({
  ...emptyOffer('PMe', 'ru-RU', NOW),
  hash: H('1'),
  ...patch,
})

describe('dueForRenewal', () => {
  it('reminds in the last two weeks of the year and after it ran out', () => {
    expect(dueForRenewal(offer({ till: NOW + (RENEW_REMIND_DAYS + 1) * DAY }), NOW)).toBe(false)
    expect(dueForRenewal(offer({ till: NOW + 3 * DAY }), NOW)).toBe(true)
    expect(dueForRenewal(offer({ till: NOW - DAY }), NOW)).toBe(true)
  })

  it('not offers the author took off or deleted, nor drafts', () => {
    expect(dueForRenewal(offer({ till: NOW + DAY, published: 'withdrawed' }), NOW)).toBe(false)
    expect(dueForRenewal(offer({ till: NOW + DAY, published: 'removed' }), NOW)).toBe(false)
    expect(dueForRenewal(offer({ till: NOW + DAY, hash: null }), NOW)).toBe(false)
  })
})

const tx = (patch: Partial<TrackedTx>): TrackedTx => ({
  id: 'l1',
  kind: 'offer',
  status: 'waiting',
  payload: { published: 'published' },
  target: H('1'),
  txid: H('9'),
  actionId: null,
  error: null,
  attempts: 1,
  createdAt: 0,
  sentAt: 0,
  settledAt: null,
  ...patch,
})

describe('operationOf: the status line of my offer', () => {
  it('a new version of a published offer is an update; of a withdrawn one — publishing', () => {
    expect(operationOf(tx({}), { published: 'published' })?.kind).toBe('updating')
    expect(operationOf(tx({}), { published: 'withdrawed' })?.kind).toBe('publishing')
    expect(operationOf(tx({}), null)?.kind).toBe('publishing')
  })

  it('withdrawing, deleting, refused, done', () => {
    expect(operationOf(tx({ payload: { published: 'withdrawed' } }), null)?.kind).toBe(
      'withdrawing'
    )
    expect(operationOf(tx({ kind: 'offerRemove', payload: { hash: H('1') } }), null)?.kind).toBe(
      'removing'
    )
    expect(operationOf(tx({ status: 'failed', kind: 'offerRemove' }), null)).toMatchObject({
      kind: 'failed',
      action: 'remove',
    })
    expect(operationOf(tx({ status: 'done' }), null)).toBeNull()
    expect(operationOf(undefined, null)).toBeNull()
  })
})

describe('gallery', () => {
  const video = {
    kind: 'video' as const,
    playlist: null,
    poster: null,
    duration: null,
    status: 'loading' as const,
  }

  it('the video goes first unless the seller put it last', () => {
    expect(gallerySlides(['a', 'b'], video, undefined).map((s) => s.kind)).toEqual([
      'video',
      'image',
      'image',
    ])
    expect(gallerySlides(['a', 'b'], video, 'last').map((s) => s.kind)).toEqual([
      'image',
      'image',
      'video',
    ])
    expect(gallerySlides(['a'], null, 'first')).toEqual([{ kind: 'image', src: 'a' }])
  })

  it('reads what the host says about a video (PeerTube states 1, 2/3, 7)', () => {
    const answer = (state: number, playlist?: string) => [
      {
        data: {
          original: {
            state: { id: state },
            duration: 42,
            streamingPlaylists: playlist ? [{ playlistUrl: playlist }] : [],
          },
          thumbnail: 'https://peertube.example/thumb.jpg',
        },
      },
    ]
    expect(parseVideoInfo(answer(1, 'https://peertube.example/v.m3u8'))).toEqual({
      playlist: 'https://peertube.example/v.m3u8',
      poster: 'https://peertube.example/thumb.jpg',
      duration: '0:42',
      status: 'ready',
    })
    expect(parseVideoInfo(answer(2)).status).toBe('processing')
    expect(parseVideoInfo(answer(7)).status).toBe('failed')
    expect(parseVideoInfo([]).status).toBe('missing')
    expect(parseVideoInfo(null).status).toBe('missing')
  })

  it('plays only a web address from the video server: not javascript: or data:', () => {
    const odd = (playlist: string, thumbnail: string) => [
      {
        data: {
          original: { state: { id: 1 }, streamingPlaylists: [{ playlistUrl: playlist }] },
          thumbnail,
        },
      },
    ]
    expect(parseVideoInfo(odd('javascript:alert(1)', 'data:image/svg+xml,<svg/>'))).toMatchObject({
      playlist: null,
      poster: null,
      status: 'failed',
    })
    expect(parseVideoInfo(odd('HTTPS://p.example/v.m3u8', 'http://p.example/t.jpg'))).toMatchObject(
      {
        playlist: 'HTTPS://p.example/v.m3u8',
        poster: 'http://p.example/t.jpg',
        status: 'ready',
      }
    )
  })
})

describe('fittingOffers', () => {
  // Root 1 «Электроника» → 10 «Ноутбуки и планшеты» → 100 «Ноутбуки», 101 «Планшеты».
  const tree = new CategoryTree([
    [1, null, 1, 'electronics', [10]],
    [10, 1, 1, 'computers', [100, 101]],
    [100, 10, 1, 'laptops', []],
    [101, 10, 2, 'tablets', []],
  ])

  it('my active offers in what the seller wants, a parent category included', () => {
    const laptop = offer({ hash: H('2'), tag: 100, till: NOW + 100 * DAY })
    const tablet = offer({ hash: H('3'), tag: 101, till: NOW + 100 * DAY, published: 'withdrawed' })
    const seller = { tags: [10] as Offer['tags'], address: 'PSeller' }
    expect(fittingOffers(seller, [laptop, tablet], tree).map((o) => o.hash)).toEqual([H('2')])
    expect(fittingOffers({ tags: ['for_nothing'], address: 'PSeller' }, [laptop], tree)).toEqual([])
    expect(
      fittingOffers({ tags: ['my_list'], address: 'PSeller' }, [laptop], tree, [100])
    ).toHaveLength(1)
    // My own offer page: my offers are not offered to me.
    expect(fittingOffers({ tags: [10], address: laptop.address }, [laptop], tree)).toEqual([])
  })
})

describe('dates', () => {
  it('«2 ноября», with the year when it is another one', () => {
    expect(formatDate(Date.UTC(2026, 10, 2, 12), 'ru', NOW)).toBe('2 ноября')
    expect(formatDate(Date.UTC(2025, 10, 2, 12), 'ru', NOW)).toMatch(/^2 ноября 2025/)
  })

  it('«с марта 2023»: the month as it stands next to a day', () => {
    expect(formatMonthYear(Date.UTC(2023, 2, 5), 'ru')).toBe('марта 2023')
    expect(formatMonthYear(Date.UTC(2023, 2, 5), 'en')).toBe('March 2023')
  })
})
