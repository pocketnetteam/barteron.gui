import { describe, expect, it } from 'vitest'
import { emptyOffer, type Offer } from '@/models/offer'
import { offerCardData, offerEquivalent, type CardContext } from './card-data'

const NOW = Date.UTC(2026, 10, 10)
const NAMES: Record<number, string> = { 58068: 'Ноутбуки', 58069: 'Планшеты', 1006: 'Горные' }

function offer(patch: Partial<Offer> = {}): Offer {
  return {
    ...emptyOffer('PSeller', 'ru-RU', NOW),
    hash: 'a'.repeat(64),
    caption: 'Велосипед',
    description: 'Горный',
    tag: 1006,
    tags: [58068, 58069],
    images: ['https://img/1.jpg', 'https://img/2.jpg'],
    priceCents: 390000,
    ...patch,
  }
}

const ctx: CardContext = {
  categoryLabel: (id) => NAMES[id] ?? null,
  rates: { RUB: 2, USD: 0.02 },
  currency: 'RUB',
  now: NOW,
}

describe('offerCardData', () => {
  it('title, photo, price with equivalent, exchange categories', () => {
    const card = offerCardData(offer(), { ...ctx, myCategories: new Set([58069]) })
    expect(card).toMatchObject({
      id: 'a'.repeat(64),
      to: { name: 'barterItem', params: { id: 'a'.repeat(64) } },
      title: 'Велосипед',
      photo: 'https://img/1.jpg',
      photoCount: 2,
      price: {
        pkoin: 3900,
        free: false,
        from: false,
        equivalent: { amount: 7800, currency: 'RUB' },
      },
      exchangeAnything: false,
      match: true,
      state: 'active',
    })
    expect(card.exchange).toEqual([
      {
        label: 'Ноутбуки',
        category: true,
        to: { name: 'category', params: { id: '58068' } },
        match: false,
      },
      {
        label: 'Планшеты',
        category: true,
        to: { name: 'category', params: { id: '58069' } },
        match: true,
      },
    ])
  })

  it('my own offer never gets the match mark', () => {
    const card = offerCardData(offer(), {
      ...ctx,
      myCategories: new Set([58069]),
      viewer: 'PSeller',
    })
    expect(card.match).toBe(false)
    expect(card.exchange?.every((e) => !e.match)).toBe(true)
  })

  it('«отдам даром»: free, no equivalent, nothing wanted', () => {
    const card = offerCardData(offer({ tags: ['for_nothing'], priceCents: 0 }), ctx)
    expect(card.price).toMatchObject({ free: true, pkoin: null, equivalent: null })
    expect(card.exchange).toEqual([])
    expect(card.exchangeAnything).toBe(false)
  })

  it('«my list» uses the seller profile; an empty list means «anything»', () => {
    expect(
      offerCardData(offer({ tags: ['my_list'] }), { ...ctx, sellerList: [1006] }).exchange?.map(
        (e) => e.label
      )
    ).toEqual(['Горные'])
    expect(offerCardData(offer({ tags: [] }), ctx).exchangeAnything).toBe(true)
    // Seller list not loaded yet: do not claim «anything».
    expect(offerCardData(offer({ tags: ['my_list'] }), ctx).exchangeAnything).toBe(false)
  })

  it('without a rate the equivalent is missing, the PKOIN price stays', () => {
    const card = offerCardData(offer(), { ...ctx, rates: null })
    expect(card.price).toMatchObject({ pkoin: 3900, equivalent: null })
  })

  it('withdrawn or expired → inactive; a transaction on its way → pending', () => {
    expect(offerCardData(offer({ published: 'withdrawed' }), ctx).state).toBe('inactive')
    expect(offerCardData(offer({ till: NOW - 1 }), ctx).state).toBe('inactive')
    expect(offerCardData(offer(), { ...ctx, pending: true }).state).toBe('pending')
  })

  it('photo URLs go through the host fix-up', () => {
    const card = offerCardData(offer(), { ...ctx, imageSrc: (u) => u.replace('img', 'cdn') })
    expect(card.photo).toBe('https://cdn/1.jpg')
  })
})

describe('offerEquivalent', () => {
  it('a currency price in the viewer’s currency is shown exactly as set', () => {
    const priced = offer({ currencyPrice: { currency: 'RUB', price: 24000 } })
    expect(offerEquivalent(priced, 'RUB', { RUB: 7 })).toEqual({ amount: 24000, currency: 'RUB' })
    // Another currency: through today's PKOIN price.
    expect(offerEquivalent(priced, 'USD', { RUB: 10, USD: 0.1 })).toEqual({
      amount: 240,
      currency: 'USD',
    })
    expect(offerEquivalent(priced, 'USD', { USD: 0.1 })).toBeNull()
  })
})
