import { describe, expect, it } from 'vitest'
import {
  formatAgo,
  formatDate,
  formatMoney,
  formatMonthYear,
  formatPkoin,
  formatRating,
  shortHash,
} from './format'

/** Intl puts no-break spaces between groups; compare with plain spaces. */
const plain = (s: string) => s.replace(/\s/g, ' ')

describe('formatPkoin', () => {
  it.each([
    [1250, 'ru', '1 250'],
    [842.5, 'ru', '842,5'],
    [0.256, 'ru', '0,26'],
    [3100, 'en', '3,100'],
    [12.5, 'en', '12.5'],
    [1250, 'sr', '1.250'],
  ])('%d (%s) → %s', (value, locale, expected) => {
    expect(plain(formatPkoin(value, locale))).toBe(expected)
  })
})

describe('formatMoney', () => {
  it('drops cents from 100 up', () => {
    expect(plain(formatMoney(4200, 'RUB', 'ru'))).toBe('4 200 ₽')
    expect(formatMoney(100, 'USD', 'en')).toBe('$100')
    expect(plain(formatMoney(12400.4, 'RUB', 'ru'))).toBe('12 400 ₽')
  })

  it('keeps cents below 100', () => {
    expect(formatMoney(42.5, 'USD', 'en')).toBe('$42.50')
  })

  it('an amount below a cent is «< 0,01», not «0,00»', () => {
    expect(formatMoney(0.004, 'USD', 'en')).toBe('< $0.01')
    expect(plain(formatMoney(0.0002, 'RUB', 'ru'))).toBe('< 0,01 ₽')
    expect(formatMoney(0.01, 'USD', 'en')).toBe('$0.01')
    expect(formatMoney(0, 'USD', 'en')).toBe('$0.00')
  })

  it('every currency of the picker in all three languages', () => {
    const shown = (locale: string) =>
      ['USD', 'EUR', 'RUB', 'BYN', 'UAH', 'KZT'].map((c) => plain(formatMoney(4200, c, locale)))
    expect(shown('ru')).toEqual(['4 200 $', '4 200 €', '4 200 ₽', '4 200 Br', '4 200 ₴', '4 200 ₸'])
    expect(shown('en')).toEqual(['$4,200', '€4,200', '₽4,200', 'Br 4,200', '₴4,200', '₸4,200'])
    expect(shown('sr')).toEqual(['4.200 $', '4.200 €', '4.200 ₽', '4.200 Br', '4.200 ₴', '4.200 ₸'])
  })

  it('falls back to the code for an unknown currency', () => {
    expect(plain(formatMoney(150, 'XYZ1', 'ru'))).toBe('150 XYZ1')
  })
})

describe('shortHash', () => {
  it('keeps the head and the tail', () => {
    expect(shortHash('3a9f00000000000000c41e')).toBe('3a9f…c41e')
  })

  it('leaves short values alone', () => {
    expect(shortHash('abcdef')).toBe('abcdef')
  })
})

describe('formatAgo', () => {
  const now = Date.UTC(2026, 10, 10, 12)
  it('«2 часа назад», «вчера», «сейчас» in the interface language', () => {
    expect(formatAgo(now - 2 * 3600_000, 'ru', now)).toBe('2 часа назад')
    expect(formatAgo(now - 26 * 3600_000, 'ru', now)).toBe('вчера')
    expect(formatAgo(now - 10_000, 'en', now)).toBe('this minute')
    expect(formatAgo(now - 3 * 3600_000, 'sr', now)).toMatch(/3/)
  })
})

describe('dates in three languages', () => {
  const now = Date.UTC(2026, 10, 10, 12)
  it('«2 ноября», with the year when it is not this one', () => {
    expect(formatDate(Date.UTC(2026, 10, 2, 12), 'ru', now)).toBe('2 ноября')
    expect(formatDate(Date.UTC(2025, 10, 2, 12), 'ru', now)).toBe('2 ноября 2025 г.')
    expect(formatDate(Date.UTC(2026, 10, 2, 12), 'en', now)).toBe('November 2')
    expect(formatDate(Date.UTC(2026, 10, 2, 12), 'sr', now)).toBe('2. новембар')
  })

  it('«На Barteron с марта 2023»: the month as next to a day', () => {
    const march = Date.UTC(2023, 2, 15, 12)
    expect(formatMonthYear(march, 'ru')).toBe('марта 2023')
    expect(formatMonthYear(march, 'en')).toBe('March 2023')
    expect(formatMonthYear(march, 'sr')).toBe('март 2023')
  })
})

describe('formatRating', () => {
  it('one decimal the way the language writes it: «4,5» in Russian and Serbian, «4.5» in English', () => {
    expect(formatRating(4.5, 'ru')).toBe('4,5')
    expect(formatRating(4.5, 'sr')).toBe('4,5')
    expect(formatRating(4.5, 'en')).toBe('4.5')
    expect(formatRating(4, 'en')).toBe('4.0')
    expect(formatRating(4.96, 'ru')).toBe('5,0')
  })
})
