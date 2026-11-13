import { describe, expect, it } from 'vitest'
import { CategoryTree } from './categories'
import {
  draftEntries,
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

  it('less than a hundredth of a PKOIN is no price: it would go out as 0', () => {
    expect(draftPrice(draft({ price: '0,004' }), null)).toEqual({ ok: false, reason: 'tooSmall' })
    expect(draftPrice(draft({ price: '0,005' }), null)).toMatchObject({ ok: true, cents: 1 })
    // 0,4 ₽ at 100 ₽ for a PKOIN, fixed or not.
    for (const fixCurrency of [true, false]) {
      expect(
        draftPrice(draft({ price: '0,4', currency: 'RUB', fixCurrency }), { RUB: 100 })
      ).toEqual({ ok: false, reason: 'tooSmall' })
    }
  })

  it('a price fixed in a currency may not be worth more PKOIN than exist either', () => {
    expect(
      draftPrice(draft({ price: '99999999999999', currency: 'RUB', fixCurrency: true }), {
        RUB: 10,
      })
    ).toEqual({ ok: false, reason: 'tooBig' })
  })

  it('odd input: a lone point, two commas, a minus, an exponent', () => {
    expect(['.', '1,5,6', '-5', '1e5', '١٢'].map(parsePrice).every(Number.isNaN)).toBe(true)
    expect(draftPrice(draft({ price: '-5' }), null)).toEqual({ ok: false, reason: 'invalid' })
    expect(draftPrice(draft({ price: '  ' }), null)).toEqual({ ok: false, reason: 'missing' })
  })
})

describe('offerFromDraft: what goes on chain, as the old form wrote it', () => {
  it('the exchange list by mode', () => {
    const tags = (patch: Partial<OfferDraft>) => offerFromDraft(draft(patch), CTX).tags
    expect(tags({ exchange: 'own', tags: [100, 17] })).toEqual([100, 17])
    // The form never repeats one; a stored draft might.
    expect(tags({ exchange: 'own', tags: [100, 17, 100] })).toEqual([100, 17])
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

  it('the fee switched off on an edit leaves the offer; the guarantor stays', () => {
    const base: Offer = {
      ...emptyOffer(ME, 'ru-RU', NOW),
      safeDeal: { validator: 'PVal', validatorFeeVariant: 'inHalf' },
    }
    expect(offerFromDraft(draft({ fee: '' }), { ...CTX, base }).safeDeal).toEqual({
      validator: 'PVal',
    })
  })

  it('texts are trimmed; an edit keeps its time, a new offer gets now', () => {
    const base: Offer = { ...emptyOffer(ME, 'ru-RU', 1000), hash: 'a'.repeat(64) }
    const fresh = offerFromDraft(draft({ caption: '  Планшет ', description: '\nНовый\n' }), CTX)
    expect([fresh.caption, fresh.description, fresh.time]).toEqual(['Планшет', 'Новый', NOW])
    expect(offerFromDraft(draft(), { ...CTX, base }).time).toBe(1000)
  })

  it('pickup points switched off write no ids, even if some were picked', () => {
    const d = draft({
      selfPickup: { on: true, info: '' },
      pickupPoints: { on: false, ids: ['c'.repeat(64)] },
    })
    expect(offerFromDraft(d, CTX).delivery).toMatchObject({
      deliveryOptions: { pickupPoints: { isEnabled: false, ids: [] } },
    })
  })

  it('a pickup point: no video from the form, the one it had stays; the address is cut at 200', () => {
    const d = draft({ tag: 97, price: '60', video: 'peertube://x/1' })
    d.point.address = 'а'.repeat(250)
    expect(offerFromDraft(d, CTX).video).toBe('')
    const base: Offer = { ...emptyOffer(ME, 'ru-RU', NOW), tag: 97, video: 'peertube://x/old' }
    const edited = offerFromDraft(d, { ...CTX, base })
    expect(edited.video).toBe('peertube://x/old')
    expect((edited.delivery.pickupPoint as { address: string }).address).toHaveLength(200)
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

  it('reads the fee, «от» and the exchange mode only from values the old app wrote', () => {
    const offer = (patch: Partial<Offer>) =>
      draftFromOffer({ ...parseOffer(MAINNET_TX), ...patch }, 'ru')
    expect(offer({ safeDeal: { validatorFeeVariant: 'seller' } }).fee).toBe('seller')
    expect(offer({ safeDeal: { validatorFeeVariant: 'inHalf' } }).fee).toBe('inHalf')
    expect(offer({ safeDeal: { validatorFeeVariant: 'buyer' } }).fee).toBe('')
    expect(offer({ metaData: { price: { prefix: 'from' } } }).priceFrom).toBe(true)
    expect(offer({ metaData: { price: { prefix: 'to' } } }).priceFrom).toBe(false)
    expect(offer({ tags: [100, 17] })).toMatchObject({ exchange: 'own', tags: [100, 17] })
    expect(offer({ tags: [] }).exchange).toBe('anything')
    expect(offer({ tags: ['for_nothing'] }).exchange).toBe('for_nothing')
    expect(offer({ tags: ['for_nothing', 'my_list'] }).exchange).toBe('for_nothing')
  })
})

describe('draftIssues', () => {
  const keys = (d: OfferDraft, ctx = {}) => draftIssues(d, { tree, ...ctx }).map((i) => i.key)

  it('a complete draft has none', () => {
    expect(keys(draft())).toEqual([])
  })

  it('no category is an error even before the category tree loads', () => {
    expect(draftIssues(draft({ tag: null })).map((i) => i.key)).toEqual(['category'])
  })

  it('a description of 9000 characters is fine, one more is too long', () => {
    expect(keys(draft({ description: 'я'.repeat(9000) }))).toEqual([])
    expect(keys(draft({ description: 'я'.repeat(9001) }))).toEqual(['tooLong'])
  })

  it('a price that rounds to nothing is an issue on the form', () => {
    expect(keys(draft({ price: '0,001' }))).toEqual(['price.tooSmall'])
    expect(keys(draft({ tag: 97, price: '0,001' }))).toContain('pointPrice.tooSmall')
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
    d.point.days[0] = { open: true, allDay: false, start: '10:00', finish: '10:00' }
    expect(keys(d)).toContain('scheduleTime')
    d.point.days[0] = { open: true, allDay: false, start: '09:00', finish: '24:00' }
    expect(keys(d)).toContain('scheduleTime')
  })

  it('place and pickup points', () => {
    expect(keys(draft({ geohash: '' }))).toEqual(['place'])
    // Not a geohash at all (an edit of a broken offer): pick the place again.
    expect(keys(draft({ geohash: 'ail' }))).toEqual(['place'])
    expect(keys(draft({ pickupPoints: { on: true, ids: [] } }))).toEqual(['pickupPoints'])
  })
})

describe('suggestCategories', () => {
  it('leaf categories sharing words with the caption', () => {
    expect(suggestCategories('Планшет 10", 64 ГБ, с чехлом', tree, names)).toEqual([100, 101])
    expect(suggestCategories('', tree, names)).toEqual([])
  })

  it('never suggests opening a pickup point', () => {
    expect(suggestCategories('Пункт выдачи заказов', tree, names)).toEqual([])
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
    // A photo whose upload failed after it got a link is not kept either.
    const failed = storedDraft(
      draft({ photos: [{ id: '1', url: 'u', status: 'failed', bytes: 1 }] })
    )
    expect(failed.photos).toEqual([])
  })

  it('a stored draft read back is the same draft', () => {
    const d = draft({
      hash: 'a'.repeat(64),
      baseTxHash: 'b'.repeat(64),
      exchange: 'own',
      fee: 'inHalf',
      selfPickup: { on: true, info: 'у метро' },
      pickupPoints: { on: true, ids: ['c'.repeat(64)] },
    })
    expect(readDraft(JSON.parse(JSON.stringify(storedDraft(d))))).toEqual(storedDraft(d))
  })

  it('a broken draft (a bug, a future version, a hand edit) gives defaults, never a crash', () => {
    const broken = {
      v: 1,
      hash: 'not-a-txid',
      baseTxHash: 5,
      caption: 5,
      description: null,
      tag: '100',
      condition: 'broken',
      photos: [null, { url: 'u', status: 'ready' }, { url: 5, status: 'ready' }],
      video: {},
      videoUploadedHere: 'yes',
      videoOrder: 'middle',
      exchange: 'barter',
      tags: ['17', 100, null, Number.NaN],
      price: 1250,
      currency: 7,
      fixCurrency: 'no',
      priceFrom: 1,
      fee: 'buyer',
      geohash: ['u'],
      selfPickup: null,
      directDelivery: { on: 'yes', info: 3 },
      pickupPoints: { on: true, ids: ['c'.repeat(64), 5] },
      point: { financialTerms: 1, days: [null, { open: 'yes' }], address: [], route: null },
      updatedAt: 'today',
    }
    const d = readDraft(broken)!
    expect(d).toMatchObject({
      hash: null,
      baseTxHash: null,
      caption: '',
      description: '',
      tag: null,
      condition: 'new',
      video: '',
      videoUploadedHere: false,
      videoOrder: 'first',
      exchange: 'own',
      tags: [100],
      price: '1250',
      currency: 'PKOIN',
      fixCurrency: false,
      priceFrom: false,
      fee: '',
      geohash: '',
      selfPickup: { on: false, info: '' },
      directDelivery: { on: false, info: '' },
      pickupPoints: { on: true, ids: ['c'.repeat(64)] },
      updatedAt: 0,
    })
    expect(d.photos.map((p) => [p.url, p.status, typeof p.id, p.bytes])).toEqual([
      ['u', 'ready', 'string', 0],
    ])
    expect(d.point.days).toHaveLength(7)
    expect(d.point).toMatchObject({ financialTerms: '', address: '', route: '' })
    // Everything that reads a draft copes with it.
    expect(() => draftIssues(d, { tree })).not.toThrow()
    expect(() => offerFromDraft(d, CTX)).not.toThrow()
    expect(() => draftEntries(ME, [[`${ME}_offer_draft`, broken]])).not.toThrow()
  })
})

describe('drafts listed in the cabinet', () => {
  const me = 'PMockUser1111111111111111111111111'
  const hash = 'a'.repeat(64)
  const draft = (caption: string, updatedAt: number) => ({
    ...newDraft('PKOIN'),
    caption,
    updatedAt,
  })

  it('new offer and edits, newest first; empty and foreign ones left out', () => {
    const entries = draftEntries(me, [
      [`${me}_offer_draft`, draft('Велосипед', 1)],
      [`${me}_offer_draft_${hash}`, draft('Ноутбук', 2)],
      [`${me}_offer_draft_bad`, draft('Битый', 3)],
      ['PSomeoneElse_offer_draft', draft('Чужой', 4)],
      [`${me}_offer`, { view: 'tile' }],
      [`${me}_offer_draft_${'b'.repeat(64)}`, draft('', 5)],
    ])
    expect(entries.map((e) => [e.hash, e.draft.caption])).toEqual([
      [hash, 'Ноутбук'],
      [null, 'Велосипед'],
    ])
  })
})
