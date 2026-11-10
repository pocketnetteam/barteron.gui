import { describe, expect, it, vi } from 'vitest'
import { createMockSdk } from '@/sdk/mock'
import {
  formatAddress,
  parseHostLocation,
  requestGeolocation,
  reverseGeocode,
  searchAddress,
} from './geo'

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

    const place = await reverseGeocode([55.75, 37.61], {
      fetcher: fetcher as unknown as typeof fetch,
    })
    expect(place?.label).toBe('Россия, Москва, Таганская ул., 3')
  })
})
