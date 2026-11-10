import { describe, expect, it, vi } from 'vitest'
import { currenciesFor, defaultCurrency, fetchRates, toEquivalent } from './rates'

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response)

describe('rates', () => {
  it('coingecko first, the rest as a cross rate through the dollar', async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes('coingecko')
        ? json({ pocketcoin: { usd: 0.02, eur: 0.018, rub: 1.9 } })
        : json({ BYN: 3.2, UAH: 41, KZT: 470 })
    )
    const rates = await fetchRates(undefined, fetcher as unknown as typeof fetch)
    expect(rates).toEqual({ USD: 0.02, EUR: 0.018, RUB: 1.9, BYN: 0.064, UAH: 0.82, KZT: 9.4 })
    expect(fetcher.mock.calls[0]![0]).toContain('ids=pocketcoin')
    expect(fetcher.mock.calls[1]![0]).toContain('tsyms=BYN%2CUAH%2CKZT')
  })

  it('cross rates failing keeps the coingecko ones', async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes('coingecko') ? json({ pocketcoin: { usd: 0.02 } }) : json({}, false)
    )
    expect(await fetchRates(['USD', 'RUB'], fetcher as unknown as typeof fetch)).toEqual({
      USD: 0.02,
    })
  })

  it('no rates at all is an error: the page says so', async () => {
    const fetcher = vi.fn(() => json({}, false))
    await expect(fetchRates(['USD'], fetcher as unknown as typeof fetch)).rejects.toThrow()
  })

  it('equivalent of a PKOIN price; none without a rate', () => {
    expect(toEquivalent(380000, 'RUB', { RUB: 2 })).toEqual({ amount: 7600, currency: 'RUB' })
    expect(toEquivalent(380000, 'RUB', {})).toBeNull()
    expect(toEquivalent(380000, 'RUB', null)).toBeNull()
  })

  it('currencies of the language first, as in the old picker', () => {
    expect(defaultCurrency('ru')).toBe('RUB')
    expect(defaultCurrency('en')).toBe('USD')
    expect(defaultCurrency('sr')).toBe('USD')
    expect(currenciesFor('ru').map((c) => c.code)).toEqual([
      'RUB',
      'BYN',
      'UAH',
      'KZT',
      'USD',
      'EUR',
    ])
  })
})
