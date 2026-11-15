import { describe, expect, it, vi } from 'vitest'
import { currenciesFor, defaultCurrency, fetchRates, toEquivalent } from './rates'

const json = (body: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response)

describe('rates', () => {
  it('coingecko first, the rest as a cross rate through the dollar', async () => {
    const fetcher = vi.fn((url: string) =>
      url.includes('coingecko')
        ? json({ pocketcoin: { usd: 0.02, eur: 0.018, rub: 1.9 } })
        : // A cross rate for a currency coingecko gave does not replace it.
          json({ BYN: 3.2, UAH: 41, KZT: 470, RUB: 99 })
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

  it('no dollar rate: nothing to cross through, cryptocompare is not asked', async () => {
    const fetcher = vi.fn(() => json({ pocketcoin: { rub: 1.9 } }))
    expect(await fetchRates(['USD', 'RUB', 'BYN'], fetcher as unknown as typeof fetch)).toEqual({
      RUB: 1.9,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('an error status is an error, whatever the body says', async () => {
    const fetcher = vi.fn(() => json({ pocketcoin: { usd: 0.02 } }, false))
    await expect(fetchRates(['USD'], fetcher as unknown as typeof fetch)).rejects.toThrow(
      'rates_500'
    )
  })

  it('no rates at all is an error: the page says so', async () => {
    const fetcher = vi.fn(() => json({}))
    await expect(fetchRates(['USD'], fetcher as unknown as typeof fetch)).rejects.toThrow(
      'rates_empty'
    )
  })

  it('answers of the wrong shape: only positive numbers are taken', async () => {
    const odd = [[], null, 'pocketcoin', { pocketcoin: [1, 2] }, { pocketcoin: { usd: '0.02' } }]
    for (const body of odd) {
      const fetcher = vi.fn(() => json(body))
      await expect(fetchRates(['USD'], fetcher as unknown as typeof fetch)).rejects.toThrow(
        'rates_empty'
      )
    }
    const mixed = vi.fn((url: string) =>
      url.includes('coingecko')
        ? json({ pocketcoin: { usd: 0.02, eur: -1, rub: null, uah: 0 } })
        : json({ Response: 'Error', Message: 'rate limit', EUR: 'x', RUB: Infinity })
    )
    expect(await fetchRates(['USD', 'EUR', 'RUB'], mixed as unknown as typeof fetch)).toEqual({
      USD: 0.02,
    })
  })

  it('a refusal without CORS headers (429 in the browser) or no answer at all', async () => {
    const cors = vi.fn((url: string) =>
      url.includes('coingecko')
        ? json({ pocketcoin: { usd: 0.02 } })
        : Promise.reject(new TypeError('Failed to fetch'))
    )
    expect(await fetchRates(['USD', 'BYN'], cors as unknown as typeof fetch)).toEqual({ USD: 0.02 })
    const refused = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(fetchRates(['USD'], refused as unknown as typeof fetch)).rejects.toThrow()

    vi.useFakeTimers()
    try {
      const hanging = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_, reject) =>
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
          )
      )
      const result = fetchRates(['USD'], hanging as unknown as typeof fetch)
      const caught = result.catch((e: Error) => e.message)
      await vi.advanceTimersByTimeAsync(15_000)
      expect(await caught).toBe('aborted')
    } finally {
      vi.useRealTimers()
    }
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
