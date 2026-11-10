/**
 * PKOIN rates, as in the old app (`loadCurrencyRates`):
 * 1. coingecko gives PKOIN in every currency it knows;
 * 2. the rest come from cryptocompare as a cross rate through the dollar —
 *    its direct PKOIN rates are far off.
 *
 * Outside services: requests go through the Bastyon fetch tunnel when the
 * host enables it. When rates fail, the price stays in PKOIN and the page says
 * the rate did not load (principle 04).
 */

import type { Money } from '@/components/offer/types'

export interface Currency {
  code: string
  symbol: string
  /** Shown first for this interface language. */
  locale?: 'ru' | 'en'
}

/** Same list and order as the old app (`src/i18n/index.js`, `currencies`). */
export const CURRENCIES: readonly Currency[] = [
  { code: 'USD', symbol: '$', locale: 'en' },
  { code: 'EUR', symbol: '€', locale: 'en' },
  { code: 'RUB', symbol: '₽', locale: 'ru' },
  { code: 'BYN', symbol: 'Br', locale: 'ru' },
  { code: 'UAH', symbol: '₴', locale: 'ru' },
  { code: 'KZT', symbol: '₸', locale: 'ru' },
]

/** Currencies of the interface language first, the rest after (old `currencies.sort`). */
export function currenciesFor(locale: string): Currency[] {
  return [
    ...CURRENCIES.filter((c) => c.locale === locale),
    ...CURRENCIES.filter((c) => c.locale !== locale),
  ]
}

/** Before the user picks one: the first currency for the language. */
export const defaultCurrency = (locale: string): string => currenciesFor(locale)[0]!.code

/** Price of one PKOIN by currency code. */
export type Rates = Readonly<Record<string, number>>

const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price'
const CRYPTOCOMPARE = 'https://min-api.cryptocompare.com/data/price'
const PKOIN_ID = 'pocketcoin'
const TIMEOUT_MS = 15_000

type Fetch = typeof fetch

async function getJson(url: string, fetcher: Fetch): Promise<unknown> {
  // Not AbortSignal.timeout: Safari 15 lacks it.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetcher(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`rates_${response.status}`)
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

const positive = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

export async function fetchRates(
  codes: readonly string[] = CURRENCIES.map((c) => c.code),
  fetcher: Fetch = fetch
): Promise<Rates> {
  const gecko = await getJson(
    `${COINGECKO}?${new URLSearchParams({ ids: PKOIN_ID, vs_currencies: codes.join(',').toLowerCase() })}`,
    fetcher
  )
  const raw = (gecko as Record<string, Record<string, unknown>>)?.[PKOIN_ID] ?? {}
  const rates: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    const rate = positive(value)
    if (rate) rates[key.toUpperCase()] = rate
  }

  const usd = rates.USD
  const missing = codes.filter((code) => !rates[code])
  if (usd && missing.length) {
    try {
      const cross = (await getJson(
        `${CRYPTOCOMPARE}?${new URLSearchParams({ fsym: 'USD', tsyms: missing.join(',') })}`,
        fetcher
      )) as Record<string, unknown>
      for (const [key, value] of Object.entries(cross ?? {})) {
        const perUsd = positive(value)
        if (perUsd) rates[key.toUpperCase()] = Number((perUsd * usd).toFixed(6))
      }
    } catch {
      // Cross rates are a bonus: keep what coingecko gave.
    }
  }

  if (!Object.keys(rates).length) throw new Error('rates_empty')
  return rates
}

/** PKOIN price in the chosen currency; `null` when there is no rate for it. */
export function toEquivalent(
  priceCents: number,
  currency: string,
  rates: Rates | null | undefined
): Money | null {
  const rate = rates?.[currency]
  if (!rate || !currency) return null
  return { amount: (priceCents / 100) * rate, currency }
}
