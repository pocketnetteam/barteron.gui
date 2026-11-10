import { describe, expect, it } from 'vitest'
import { CategoryTree } from './categories'
import {
  draftFromOffer,
  draftIssues,
  draftPrice,
  newDraft,
  offerFromDraft,
  parsePrice,
  readDraft,
  safeDealPossible,
  storedDraft,
  suggestCategories,
  type OfferDraft,
} from './draft'
import { emptyOffer, parseOffer, toOfferPayload, type Offer } from './offer'
import { TX_TYPE, type RawTx } from './tx'

const ME = 'PMe1111111111111111111111111111111'
const NOW = Date.UTC(2026, 10, 10)
const CTX = { address: ME, language: 'ru-RU', now: NOW }

/** Root 1 «Электроника» → 10 → 100 «Планшеты», 101 «Чехлы»; 17 PKOIN; 97 pickup points. */
const tree = new CategoryTree([
  [1, null, 1, 'electronics', [10]],
  [10, 1, 1, 'computers', [100, 101]],
  [100, 10, 1, 'tablets', []],
  [101, 10, 2, 'cases', []],
  [17, null, 2, 'pkoin', []],
  [97, null, 3, 'pickup', []],
])
const names = {
  electronics: 'Электроника',
  computers: 'Компьютеры',
  tablets: 'Ноутбуки, планшеты и электронные книги',
  cases: 'Чехлы для планшетов',
  pkoin: 'Покеткоины',
  pickup: 'Пункт выдачи заказов',
}

const draft = (patch: Partial<OfferDraft> = {}): OfferDraft => ({
  ...newDraft('PKOIN', NOW),
  caption: 'Планшет',
  description: 'Почти новый',
  tag: 100,
  photos: [{ id: 'p1', url: 'https://img/1.jpg', status: 'ready', bytes: 10 }],
  tags: [17],
  price: '1250',
  geohash: 'ucftpuzx8p6g',
  ...patch,
})

describe('price as typed', () => {
  it('«12 400», «0,29», nothing, letters', () => {
    expect(parsePrice('12 400')).toBe(12400)
    expect(parsePrice('12 400')).toBe(12400)
    expect(parsePrice('0,29')).toBe(0.29)
    expect(parsePrice('')).toBeNaN()
    expect(parsePrice('12a')).toBeNaN()
  })

  it('PKOIN goes to hundredths without losing a cent', () => {
    expect(draftPrice(draft({ price: '0,29' }), null)).toMatchObject({ ok: true, cents: 29 })
    expect(draftPrice(draft({ price: '' }), null)).toEqual({ ok: false, reason: 'missing' })
    expect(draftPrice(draft({ price: '0' }), null)).toEqual({ ok: false, reason: 'missing' })
    expect(draftPrice(draft({ price: '999999999999' }), null)).toEqual({
      ok: false,
      reason: 'tooBig',
    })
  })

  it('a currency price: fixed, converted once, or no rate', () => {
    const rates = { RUB: 10 }
    expect(
      draftPrice(draft({ price: '12 400', currency: 'RUB', fixCurrency: true }), rates)
    ).toEqual({
      ok: true,
      cents: 124000,
      currencyPrice: { currency: 'RUB', price: 12400 },
      pkoin: 1240,
    })
    expect(
      draftPrice(draft({ price: '12 400', currency: 'RUB', fixCurrency: false }), rates)
    ).toMatchObject({ ok: true, cents: 124000, currencyPrice: {} })
    expect(draftPrice(draft({ currency: 'RUB' }), null)).toEqual({ ok: false, reason: 'noRate' })
  })

  it('«Отдам даром» has no price', () => {
    expect(draftPrice(draft({ exchange: 'for_nothing', price: '' }), null)).toMatchObject({
      ok: true,
      cents: 0,
    })
  })
})

describe('offerFromDraft: what goes on chain, as the old form wrote it', () => {
  it('the exchange list by mode', () => {
    const tags = (patch: Partial<OfferDraft>) => offerFromDraft(draft(patch), CTX).tags
    expect(tags({ exchange: 'own', tags: [100, 17] })).toEqual([100, 17])
    expect(tags({ exchange: 'my_list' })).toEqual(['my_list'])
    expect(tags({ exchange: 'for_nothing' })).toEqual(['for_nothing'])
    expect(tags({ exchange: 'anything' })).toEqual([])
  })

  it('«от» is added and removed; other metaData stays', () => {
    const base: Offer = {
      ...emptyOffer(ME, 'ru-RU', NOW),
      hash: 'a'.repeat(64),
      metaData: { price: { prefix: 'from' }, votes: 3 },
    }
    expect(offerFromDraft(draft({ priceFrom: true }), CTX).metaData).toEqual({
      price: { prefix: 'from' },
    })
    expect(offerFromDraft(draft({ priceFrom: false }), { ...CTX, base }).metaData).toEqual({
      votes: 3,
    })
  })

  it('the guarantor fee only with PKOIN in the list; a guarantor stays', () => {
    const base: Offer = { ...emptyOffer(ME, 'ru-RU', NOW), safeDeal: { validator: 'PVal' } }
    expect(offerFromDraft(draft({ fee: 'inHalf' }), { ...CTX, base }).safeDeal).toEqual({
      validator: 'PVal',
      validatorFeeVariant: 'inHalf',
    })
    expect(offerFromDraft(draft({ fee: 'inHalf', tags: [100] }), CTX).safeDeal).toEqual({})
    expect(safeDealPossible(draft({ exchange: 'my_list' }), [17])).toBe(true)
  })

  it('delivery: nothing on — `{}`; otherwise all three ways', () => {
    expect(offerFromDraft(draft(), CTX).delivery).toEqual({})
    expect(
      offerFromDraft(draft({ selfPickup: { on: true, info: ' м. Таганская ' } }), CTX).delivery
    ).toEqual({
      deliveryOptions: {
        pickupPoints: { isEnabled: false, ids: [] },
        selfPickup: { isEnabled: true, additionalInfo: 'м. Таганская' },
        directDelivery: { isEnabled: false, additionalInfo: '' },
      },
    })
  })

  it('a pickup point writes its terms; closed days are left out', () => {
    const d = draft({ tag: 97, price: '60' })
    d.point.financialTerms = '60 PKOIN за посылку'
    d.point.days[5] = { open: true, allDay: true, start: '', finish: '' }
    d.point.address = 'ул. Марксистская, 3'
    d.point.route = 'Арка у аптеки'
    const offer = offerFromDraft(d, CTX)
    expect(offer.tags).toEqual([])
    expect(offer.priceCents).toBe(6000)
    expect(offer.delivery).toEqual({
      pickupPoint: {
        financialTerms: '60 PKOIN за посылку',
        workSchedule: {
          weekDays: {
            day1: { startTime: '10:00', finishTime: '20:00' },
            day2: { startTime: '10:00', finishTime: '20:00' },
            day3: { startTime: '10:00', finishTime: '20:00' },
            day4: { startTime: '10:00', finishTime: '20:00' },
            day5: { startTime: '10:00', finishTime: '20:00' },
            day6: { allDay: true },
          },
          additionalInfo: '',
        },
        address: 'ул. Марксистская, 3',
        route: 'Арка у аптеки',
      },
    })
  })

  it('only uploaded photos go out', () => {
    const offer = offerFromDraft(
      draft({
        photos: [
          { id: '1', url: 'https://img/1.jpg', status: 'ready', bytes: 1 },
          { id: '2', url: null, status: 'uploading', bytes: 1 },
          { id: '3', url: null, status: 'failed', bytes: 1 },
        ],
      }),
      CTX
    )
    expect(offer.images).toEqual(['https://img/1.jpg'])
  })
})

/** The mainnet offer from offer.test.ts: «Сеансы биоэнерготерапевта». */
const ROOT = '430ecc22' + '0'.repeat(52) + 'b541'
const MAINNET_TX: RawTx = {
  hash: ROOT,
  type: TX_TYPE.offer,
  height: 4_097_000,
  time: 1_770_000_000,
  s1: 'PAk3r2YK9ZbrTgxpkwV4tS599xD8pohPMo',
  s2: ROOT,
  p: {
    s1: 'ru-RU',
    s2: 'Сеансы биоэнерготерапевта',
    s3: 'Сеансы биоэнерготерапевта.',
    s4: '{"t":277,"a":["my_list"],"c":"new","p":"published","f":{"currency":"RUB","price":"45068.00"},"d":{},"v":{"order":"first"},"s":{},"m":{}}',
    s5: '["https://bastyon.com:8092/i/OUnkKeuoOVnlxRaJCoDudc.jfif"]',
    s6: 'ucfsmxzf7gs3',
    i1: 380000,
  },
}

describe('editing an offer made by the old app', () => {
  it('saved without changes, it writes the same offer (the price follows today’s rate)', () => {
    const original = parseOffer(MAINNET_TX)
    const form = draftFromOffer(original, 'ru')
    expect(form).toMatchObject({
      hash: ROOT,
      exchange: 'my_list',
      currency: 'RUB',
      price: '45068',
      fixCurrency: true,
      videoOrder: 'first',
    })
    // 45 068 ₽ at 11,86 ₽ for a PKOIN is the 3 800 PKOIN on chain.
    const again = offerFromDraft(form, {
      address: original.address,
      language: 'en-US',
      rates: { RUB: 45068 / 3800 },
      base: original,
    })
    expect(toOfferPayload(again)).toEqual({
      ...toOfferPayload(original),
      // The old app stored a string here (`toFixed`); a number reads the same.
      currencyPrice: { currency: 'RUB', price: 45068 },
    })
  })
})

describe('draftIssues', () => {
  const keys = (d: OfferDraft, ctx = {}) => draftIssues(d, { tree, ...ctx }).map((i) => i.key)

  it('a complete draft has none', () => {
    expect(keys(draft())).toEqual([])
  })

  it('a category with subcategories is too wide', () => {
    expect(keys(draft({ tag: 10 }))).toEqual(['categoryWide'])
  })

  it('photos: none, failed (by number), still uploading — the last only waits', () => {
    expect(keys(draft({ photos: [] }))).toEqual(['photos'])
    const issues = draftIssues(
      draft({
        photos: [
          { id: '1', url: 'u', status: 'ready', bytes: 1 },
          { id: '2', url: null, status: 'failed', bytes: 1 },
          { id: '3', url: null, status: 'uploading', bytes: 1 },
        ],
      })
    )
    expect(issues.map((i) => [i.key, i.level, i.params])).toEqual([
      ['photosFailed', 'error', { numbers: '2' }],
      ['photosUploading', 'wait', undefined],
    ])
  })

  it('a video being processed holds publishing; a failed one must go', () => {
    expect(draftIssues(draft({ video: 'v' }), { videoStatus: 'processing' })[0]).toMatchObject({
      key: 'videoProcessing',
      level: 'wait',
    })
    expect(keys(draft({ video: 'v' }), { videoStatus: 'failed' })).toEqual(['videoFailed'])
  })

  it('exchange and price', () => {
    expect(keys(draft({ tags: [] }))).toEqual(['tags'])
    expect(keys(draft({ exchange: 'my_list' }), { myList: [] })).toEqual(['myListEmpty'])
    expect(keys(draft({ price: '' }))).toEqual(['price.missing'])
    expect(keys(draft({ exchange: 'for_nothing', price: '' }))).toEqual([])
  })

  it('pickup point: terms, schedule, address, route', () => {
    const d = draft({ tag: 97, price: '60' })
    d.point.days = d.point.days.map((day) => ({ ...day, open: false }))
    expect(keys(d)).toEqual(['financialTerms', 'scheduleEmpty', 'address', 'route'])
    d.point.days[0] = { open: true, allDay: false, start: '21:00', finish: '10:00' }
    expect(keys(d)).toContain('scheduleTime')
  })

  it('place and pickup points', () => {
    expect(keys(draft({ geohash: '' }))).toEqual(['place'])
    expect(keys(draft({ pickupPoints: { on: true, ids: [] } }))).toEqual(['pickupPoints'])
  })
})

describe('suggestCategories', () => {
  it('leaf categories sharing words with the caption', () => {
    expect(suggestCategories('Планшет 10", 64 ГБ, с чехлом', tree, names)).toEqual([100, 101])
    expect(suggestCategories('', tree, names)).toEqual([])
  })
})

describe('the draft on the device', () => {
  it('keeps uploaded photos only, without picture data', () => {
    const stored = storedDraft(
      draft({
        photos: [
          { id: '1', url: 'u', status: 'ready', bytes: 5, data: 'data:image/jpeg;base64,AAA' },
          { id: '2', url: null, status: 'uploading', bytes: 5, data: 'data:…' },
        ],
      })
    )
    expect(stored.photos).toEqual([{ id: '1', url: 'u', status: 'ready', bytes: 5 }])
    expect(readDraft(JSON.parse(JSON.stringify(stored)))?.photos).toHaveLength(1)
    expect(readDraft({ v: 2 })).toBeNull()
    expect(readDraft('junk')).toBeNull()
  })
})
