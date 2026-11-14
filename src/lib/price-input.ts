/**
 * The price as typed in a field (offer form, catalog filters), read the
 * same way everywhere.
 */

/**
 * Thousands as typed besides spaces, by the interface language: «12.400» in
 * Serbian, «12,400» in English. Read as a fraction they would make the price
 * a thousand times smaller (audit, finding 19). Russian groups with spaces.
 */
const THOUSANDS: Record<string, RegExp> = {
  sr: /^\d{1,3}(\.\d{3})+(,\d*)?$/,
  en: /^\d{1,3}(,\d{3})+(\.\d*)?$/,
}

/**
 * «12 400» or «0,29» → 12400 / 0.29; NaN when it is not a number. With the
 * interface language, its thousands separator too.
 */
export function parsePrice(text: string, locale = 'ru'): number {
  const clean = text.replace(/[\s\u00a0\u202f']/g, '')
  const lang = locale.slice(0, 2)
  const grouped = THOUSANDS[lang]?.test(clean) ?? false
  const plain = (grouped ? clean.split(lang === 'sr' ? '.' : ',').join('') : clean).replace(
    ',',
    '.'
  )
  if (!plain) return NaN
  return /^\d*\.?\d*$/.test(plain) ? Number(plain) : NaN
}

/** A number for the price field: «1250», «0,29» in Russian. */
export function priceText(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    value
  )
}

/**
 * The price field once left: text the language reads differently from
 * the rest of the app («12.400» in Serbian) is written the one way all read
 * alike — «12400» — so the draft, the review and the offer agree, and the
 * seller sees how it was read. Anything else stays as typed.
 */
export function tidyPrice(text: string, locale: string): string {
  const amount = parsePrice(text, locale)
  return Number.isFinite(amount) && !Object.is(amount, parsePrice(text))
    ? priceText(amount, locale)
    : text
}
