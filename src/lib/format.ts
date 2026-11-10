/**
 * Number formatting for prices. Same rules as the old app (i18n
 * `shortPkoin`): PKOIN with grouping and up to 2 decimals. The currency
 * equivalent drops cents from 100 up, as on the mockups («≈ 4 200 ₽»).
 */

const cache = new Map<string, Intl.NumberFormat>()

function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, options)
    cache.set(key, f)
  }
  return f
}

/** «1 250», «842,5», «0,25» — the number only, without «PKOIN». */
export function formatPkoin(value: number, locale: string): string {
  return formatter(locale, {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/** «4 200 ₽», «$42.50», «12 400 RSD». */
export function formatMoney(amount: number, currency: string, locale: string): string {
  const digits = Math.abs(amount) >= 100 ? 0 : 2
  try {
    return formatter(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount)
  } catch {
    // Unknown currency code or no narrowSymbol support: number and code.
    return `${formatter(locale, { maximumFractionDigits: digits }).format(amount)} ${currency}`
  }
}

/** Shortened hash or address for mono text: «3a9f…c41e». */
export function shortHash(value: string, head = 4, tail = 4): string {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** «2 часа назад», «вчера», «только что»: when an offer was published. */
export function formatAgo(time: number, locale: string, now = Date.now()): string {
  const seconds = Math.round((time - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit)
  }
  return rtf.format(0, 'minute')
}

/** «2 ноября», with the year when it is not this year: «2 ноября 2025». */
export function formatDate(time: number, locale: string, now = Date.now()): string {
  const date = new Date(time)
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date)
}

/**
 * «марта 2023» for «На Barteron с марта 2023»: the month as it stands next to
 * a day (genitive in Russian and Serbian), then the year.
 */
export function formatMonthYear(time: number, locale: string): string {
  const date = new Date(time)
  const month = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
    .formatToParts(date)
    .find((p) => p.type === 'month')?.value
  return `${month ?? ''} ${date.getFullYear()}`.trim()
}
