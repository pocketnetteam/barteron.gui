import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { markRaw, nextTick } from 'vue'
import { setLocale } from '@/i18n'
import { createMockSdk } from '@/sdk/mock'
import { useCurrencyStore } from './currency'
import { useLocationStore } from './location'
import { useSessionStore } from './session'

const ME = 'PMockUser1111111111111111111111111'
const BOUNDS = { _southWest: { lat: 44.7, lng: 20.3 }, _northEast: { lat: 44.9, lng: 20.6 } }

describe('settings kept under the old app’s keys', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    setLocale('ru')
  })

  it('currency: the old `<address>_currency` choice carries over; default by language', async () => {
    localStorage.setItem(`${ME}_currency`, JSON.stringify('EUR'))
    const session = useSessionStore()
    const currency = useCurrencyStore()
    expect(currency.code).toBe('RUB')
    session.address = ME
    await nextTick()
    expect(currency.code).toBe('EUR')
    currency.set('KZT')
    expect(localStorage.getItem(`${ME}_currency`)).toBe('"KZT"')
    currency.set('XXX')
    expect(currency.code).toBe('KZT')
  })

  it('location: old bounds become the feed filter; reset drops it', async () => {
    localStorage.setItem(
      `${ME}_location`,
      JSON.stringify({ geohash: 'srywc', zoom: 11, bounds: BOUNDS })
    )
    const session = useSessionStore()
    session.address = ME
    const location = useLocationStore()
    await nextTick()
    expect(location.filtered).toBe(true)
    expect(location.feedLocation.length).toBeGreaterThan(0)
    expect(location.feedLocation.every((p) => p.startsWith('sr'))).toBe(true)

    location.reset(true)
    expect(location.filtered).toBe(false)
    expect(location.feedLocation).toEqual([])
    expect(JSON.parse(localStorage.getItem(`${ME}_location`)!)).toEqual({
      geohash: 'srywc',
      zoom: 11,
      bounds: null,
    })
  })

  it('location: broken stored data is ignored', () => {
    localStorage.setItem('location', '{"bounds":{"_southWest":{"lat":"x"}}}')
    expect(useLocationStore().stored).toEqual({ geohash: null, zoom: null, bounds: null })
  })

  it('device location through Bastyon', async () => {
    const session = useSessionStore()
    session.sdk = markRaw(createMockSdk({ granted: ['geolocation'] }))
    const location = useLocationStore()
    expect(await location.locate()).toEqual([44.8125, 20.4612])
    expect(location.deviceStatus).toBe('ok')
  })
})
