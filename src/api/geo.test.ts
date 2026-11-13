import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockSdk } from '@/sdk/mock'
import {
  formatAddress,
  GEOLOCATION_TIMEOUT_MS,
  NOMINATIM_BACKOFF_MS,
  NOMINATIM_TIMEOUT_MS,
  parseHostLocation,
  requestGeolocation,
  resetNominatimPause,
  reverseGeocode,
  searchAddress,
} from './geo'

beforeEach(() => resetNominatimPause())

const json = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response)

describe('device location through Bastyon', () => {
  it('reads the host answer in its known shapes', () => {
    expect(parseHostLocation({ latitude: 44.8, longitude: 20.4 })).toEqual([44.8, 20.4])
    expect(parseHostLocation([44.8, 20.4])).toEqual([44.8, 20.4])
    expect(parseHostLocation({ a: 44.8, b: 20.4 })).toEqual([44.8, 20.4])
    expect(parseHostLocation({ latitude: 'x' })).toBeNull()
    expect(parseHostLocation({ latitude: 120, longitude: 0 })).toBeNull()
  })

  it('asks for the permission only when told to', async () => {
    const sdk = createMockSdk({ granted: [] })
    expect(await requestGeolocation(sdk, false)).toEqual({ status: 'denied' })
    expect(sdk.mock.calls.some((c) => c.method === 'permissions.request')).toBe(false)
    expect(await requestGeolocation(sdk, true)).toEqual({ status: 'ok', point: [44.8125, 20.4612] })
  })

  it('a refused permission stays denied', async () => {
    const sdk = createMockSdk({ granted: [], grantOnRequest: false })
    expect(await requestGeolocation(sdk, true)).toEqual({ status: 'denied' })
  })
})

describe('Nominatim', () => {
  const moscow = {
    lat: '55.75',
    lon: '37.61',
    display_name: 'long name',
    address: {
      country_code: 'ru',
      country: 'Россия',
      state: 'Москва',
      city: 'Москва',
      road: 'Таганская улица',
      house_number: '3',
    },
  }

  it('short address: country first in Russia, street first elsewhere', () => {
    expect(formatAddress(moscow)).toBe('Россия, Москва, Таганская ул., 3')
    expect(
      formatAddress({
        lat: '0',
        lon: '0',
        address: {
          country_code: 'rs',
          country: 'Србија',
          city: 'Београд',
          road: 'Кнез Михаилова',
          house_number: '5',
        },
      })
    ).toBe('Кнез Михаилова, 5, Београд, Србија')
    expect(formatAddress({ lat: '0', lon: '0', display_name: 'as is' })).toBe('as is')
  })

  it('search and reverse send the language and parse the places', async () => {
    const fetcher = vi.fn((url: string) => json(url.includes('/search') ? [moscow] : moscow))
    const found = await searchAddress(' Таганская ', {
      locale: 'ru',
      fetcher: fetcher as unknown as typeof fetch,
    })
    expect(found[0]).toMatchObject({
      point: [55.75, 37.61],
      label: 'Россия, Москва, Таганская ул., 3',
    })
    const url = new URL(fetcher.mock.calls[0]![0])
    expect(url.origin).toBe('https://nominatim.openstreetmap.org')
    expect(url.searchParams.get('q')).toBe('Таганская')
    expect(url.searchParams.get('accept-language')).toBe('ru')
    expect(await searchAddress('  ')).toEqual([])

    // One request a second: the reverse request waits for its turn.
    vi.useFakeTimers()
    try {
      const pending = reverseGeocode([55.75, 37.61], {
        fetcher: fetcher as unknown as typeof fetch,
      })
      await vi.advanceTimersByTimeAsync(0)
      expect(fetcher).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1000)
      expect((await pending)?.label).toBe('Россия, Москва, Таганская ул., 3')
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('Nominatim: limits, refusals, odd answers', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const place = { lat: '55.75', lon: '37.61', address: { country_code: 'ru', city: 'Москва' } }
  const reply = (status: number, body: unknown = {}) =>
    Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)
  /** Answers by URL: a list for a search, one place for a reverse request. */
  const nominatim = (status = 200) =>
    vi.fn((url: string) => reply(status, url.includes('/search') ? [place] : place))
  const as = (f: unknown) => f as typeof fetch

  it('a request with no answer is given up and does not hold the queue', async () => {
    const hang = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        )
    )
    const first = reverseGeocode([55.75, 37.61], { fetcher: as(hang) }).catch((e: Error) => e)
    const next = searchAddress('Москва', { fetcher: as(nominatim()) })
    await vi.advanceTimersByTimeAsync(NOMINATIM_TIMEOUT_MS + 1000)
    expect(await first).toMatchObject({ message: 'nominatim_timeout' })
    expect((await next)[0]?.point).toEqual([55.75, 37.61])
  })

  it('after a refusal place names wait, the address search does not; an answer clears it', async () => {
    const refused = nominatim(429)
    await expect(reverseGeocode([1, 1], { fetcher: as(refused) })).rejects.toThrow('nominatim_429')
    // Place names: refused at once, nothing sent.
    await expect(reverseGeocode([1, 1], { fetcher: as(refused) })).rejects.toThrow(
      'nominatim_paused'
    )
    expect(refused).toHaveBeenCalledTimes(1)
    // Someone typed an address: it still goes, and an answer ends the pause.
    const ok = nominatim()
    const found = searchAddress('Москва', { fetcher: as(ok) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(await found).toHaveLength(1)
    const name = reverseGeocode([1, 1], { fetcher: as(ok) })
    await vi.advanceTimersByTimeAsync(1000)
    expect((await name)?.point).toEqual([55.75, 37.61])
  })

  it('a failed request (429 comes with no CORS headers) is a refusal too, and the pause grows', async () => {
    const down = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(reverseGeocode([1, 1], { fetcher: as(down) })).rejects.toThrow('Failed to fetch')
    await vi.advanceTimersByTimeAsync(NOMINATIM_BACKOFF_MS[0] + 1)
    await expect(reverseGeocode([1, 1], { fetcher: as(down) })).rejects.toThrow('Failed to fetch')
    expect(down).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(NOMINATIM_BACKOFF_MS[1] - 1000)
    await expect(reverseGeocode([1, 1], { fetcher: as(down) })).rejects.toThrow('nominatim_paused')
    expect(down).toHaveBeenCalledTimes(2)
  })

  it('a bad query and a screen that was left are not refusals', async () => {
    await expect(searchAddress('???', { fetcher: as(nominatim(400)) })).rejects.toThrow(
      'nominatim_400'
    )
    const controller = new AbortController()
    const hang = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          )
        )
    )
    await vi.advanceTimersByTimeAsync(1000)
    const left = reverseGeocode([1, 1], { fetcher: as(hang), signal: controller.signal })
    await vi.advanceTimersByTimeAsync(0)
    controller.abort()
    await expect(left).rejects.toMatchObject({ name: 'AbortError' })
    const ok = nominatim()
    const name = reverseGeocode([2, 2], { fetcher: as(ok) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(await name).not.toBeNull()
  })

  it('the same search is not asked twice', async () => {
    const fetcher = nominatim()
    const first = await searchAddress('Таганская', { locale: 'ru', fetcher: as(fetcher) })
    const again = await searchAddress(' Таганская ', { locale: 'ru', fetcher: as(fetcher) })
    expect(again).toEqual(first)
    expect(fetcher).toHaveBeenCalledTimes(1)
    // Another language is another answer.
    const en = searchAddress('Таганская', { locale: 'en', fetcher: as(fetcher) })
    await vi.advanceTimersByTimeAsync(1000)
    await en
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('odd answers: not a list, empty items, names that are not text', async () => {
    const odd = vi.fn((url: string) =>
      reply(
        200,
        url.includes('/search')
          ? [
              null,
              5,
              { lat: 'x', lon: '1' },
              {
                lat: '1',
                lon: '2',
                address: { country_code: 'ru', state: 7, city: 'Тверь', road: { a: 1 } },
              },
            ]
          : { error: 'Unable to geocode' }
      )
    )
    const found = await searchAddress('Тверь', { fetcher: as(odd) })
    expect(found.map((p) => p.label)).toEqual(['Тверь'])
    expect(found[0]!.raw.address).toEqual({ country_code: 'ru', city: 'Тверь' })
    const none = reverseGeocode([1, 1], { fetcher: as(odd) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(await none).toBeNull()
    const notList = vi.fn(() => reply(200, { places: [] }))
    const empty = searchAddress('Ржев', { fetcher: as(notList) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(await empty).toEqual([])
  })

  it('a device location that never comes fails after a while', async () => {
    const sdk = createMockSdk({ granted: ['geolocation'] })
    vi.spyOn(sdk.get, 'geolocation').mockReturnValue(new Promise(() => {}))
    const result = requestGeolocation(sdk, false)
    await vi.advanceTimersByTimeAsync(GEOLOCATION_TIMEOUT_MS)
    expect(await result).toMatchObject({
      status: 'failed',
      error: { message: 'geolocation_timeout' },
    })
  })
})
