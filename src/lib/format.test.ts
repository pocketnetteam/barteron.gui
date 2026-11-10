import { describe, expect, it } from 'vitest'
import { formatAgo, formatMoney, formatPkoin, shortHash } from './format'

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
    expect(plain(formatMoney(12400.4, 'RUB', 'ru'))).toBe('12 400 ₽')
  })

  it('keeps cents below 100', () => {
    expect(formatMoney(42.5, 'USD', 'en')).toBe('$42.50')
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
