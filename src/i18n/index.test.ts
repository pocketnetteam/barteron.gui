import { describe, expect, it } from 'vitest'
import { resolveLocale } from './index'

describe('resolveLocale', () => {
  it.each([
    ['ru', 'ru'],
    ['ru-RU', 'ru'],
    ['sr_RS', 'sr'],
    ['EN-us', 'en'],
    ['de', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    [null, 'en'],
  ])('%s → %s', (input, expected) => {
    expect(resolveLocale(input)).toBe(expected)
  })
})
