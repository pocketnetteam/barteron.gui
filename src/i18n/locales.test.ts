import { describe, expect, it } from 'vitest'
import { i18n, LOCALES, type Locale } from './index'
import en from './locales/en'
import ru from './locales/ru'
import sr from './locales/sr'

type Tree = { [key: string]: string | Tree }
function flat(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') all[path] = value
    else Object.assign(all, flat(value, path))
    return all
  }, {})
}

const TEXTS: Record<Locale, Record<string, string>> = {
  ru: flat(ru as unknown as Tree),
  en: flat(en as unknown as Tree),
  sr: flat(sr as unknown as Tree),
}
const KEYS = Object.keys(TEXTS.ru)
const params = (text: string) =>
  [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort()
const forms = (text: string) => text.split(' | ').length
/** Plural forms a language writes: one / few / many for ru and sr, one / other for en. */
const FULL: Record<Locale, number> = { ru: 3, en: 2, sr: 3 }
/** Words that do not change with the number («5 фото»). */
const INVARIABLE: Record<string, Locale[]> = {
  'create.review.photosCount': ['ru'],
  'item.gallery.morePhotos': ['ru', 'sr'],
}
/** Counts that are a constant, never one (`PICKUP_STORAGE_DAYS`). */
const CONSTANT = ['item.pickup.storageText', 'item.pickup.storageShort']

describe('texts in the three languages', () => {
  it('have the same keys', () => {
    for (const locale of LOCALES)
      expect(Object.keys(TEXTS[locale]).sort()).toEqual([...KEYS].sort())
  })

  it('have the same parameters in every key', () => {
    const odd = KEYS.filter((key) =>
      LOCALES.some((l) => params(TEXTS[l][key]!).join() !== params(TEXTS.ru[key]!).join())
    )
    expect(odd).toEqual([])
  })

  it('a plural text has all its forms in every language', () => {
    const odd = KEYS.filter((key) => {
      if (!LOCALES.some((l) => forms(TEXTS[l][key]!) > 1)) return false
      return LOCALES.some(
        (l) => forms(TEXTS[l][key]!) !== (INVARIABLE[key]?.includes(l) ? 1 : FULL[l])
      )
    })
    expect(odd).toEqual([])
  })

  it('a number before an English plural noun has its forms («1 offers» is wrong)', () => {
    const odd = KEYS.filter(
      (key) =>
        !CONSTANT.includes(key) &&
        forms(TEXTS.en[key]!) === 1 &&
        /\{(n|count)\} [a-z]+s\b/.test(TEXTS.en[key]!)
    )
    expect(odd).toEqual([])
  })

  it('only the message syntax vue-i18n reads: no stray @, | or braces', () => {
    const odd = LOCALES.flatMap((l) =>
      KEYS.filter((key) => {
        const text = TEXTS[l][key]!
        return (
          /[@$]/.test(text) ||
          /\|/.test(text.replace(/ \| /g, '')) ||
          /\{(?!\w+\})|(?<!\{\w+)\}/.test(text)
        )
      }).map((key) => `${l}:${key}`)
    )
    expect(odd).toEqual([])
  })

  it('a plural text picks its form by the number', () => {
    const t = i18n.global.t
    const at = (locale: Locale, n: number) => {
      i18n.global.locale.value = locale
      return t('map.group', { n }, n)
    }
    expect([1, 3, 5, 21].map((n) => at('ru', n))).toEqual([
      '1 объявление рядом',
      '3 объявления рядом',
      '5 объявлений рядом',
      '21 объявление рядом',
    ])
    expect([1, 2].map((n) => at('en', n))).toEqual(['1 offer nearby', '2 offers nearby'])
    i18n.global.locale.value = 'ru'
  })
})
