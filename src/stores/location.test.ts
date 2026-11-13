import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { BRIGHTEON_CENTER } from '@/lib/geohash'
import { useLocationStore } from './location'
import { useSessionStore } from './session'

const zone = (timeZone: string) =>
  vi
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockReturnValue({ ...new Intl.DateTimeFormat().resolvedOptions(), timeZone })

describe('where a map opens', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Brighteon: a time zone outside Canada and the USA gives way to their centre (old `getDefaultLocation`)', () => {
    zone('Europe/Moscow')
    const session = useSessionStore()
    const location = useLocationStore()
    expect(location.mapCenter).toEqual([55.7558, 37.6173])
    session.appinfo = { project: { name: 'Brighteon', url: '', protocol: '' } }
    expect(location.mapCenter).toEqual(BRIGHTEON_CENTER)
  })

  it('Brighteon: a time zone inside stays; the device and a chosen place always win', () => {
    zone('America/Chicago')
    const session = useSessionStore()
    session.appinfo = { project: { name: 'brighteon', url: '', protocol: '' } }
    const location = useLocationStore()
    expect(location.mapCenter).toEqual([41.8781, -87.6298])
    // As in the old app, only the guess from the time zone is moved.
    location.device = [55.75, 37.61]
    expect(location.mapCenter).toEqual([55.75, 37.61])
  })
})

describe('the place filter kept on the device', () => {
  const ME = 'PMockUser1111111111111111111111111'
  const moscow = {
    geohash: 'ucfv0n0',
    zoom: 11,
    bounds: { _southWest: { lat: 55.66, lng: 37.45 }, _northEast: { lat: 55.84, lng: 37.77 } },
  }
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  async function read(raw: string) {
    localStorage.setItem(`${ME}_location`, raw)
    const session = useSessionStore()
    const location = useLocationStore()
    session.address = ME
    await nextTick()
    return location
  }

  it('the old app’s shape reads as is', async () => {
    const location = await read(JSON.stringify(moscow))
    expect(location.filtered).toBe(true)
    expect(location.area?.radiusKm).toBe(10)
    expect(location.feedLocation.length).toBeGreaterThan(0)
  })

  it.each([
    ['not JSON', '{oops'],
    [
      'bounds of text',
      JSON.stringify({
        ...moscow,
        bounds: { _southWest: { lat: '55', lng: '37' }, _northEast: { lat: '56', lng: '38' } },
      }),
    ],
    [
      'a latitude past the pole',
      JSON.stringify({
        ...moscow,
        bounds: { ...moscow.bounds, _northEast: { lat: 200, lng: 37.77 } },
      }),
    ],
    [
      'a longitude off the map',
      JSON.stringify({
        ...moscow,
        bounds: { ...moscow.bounds, _northEast: { lat: 55.84, lng: 1e9 } },
      }),
    ],
    ['no corner', JSON.stringify({ ...moscow, bounds: { _southWest: { lat: 55, lng: 37 } } })],
  ])('%s: no place filter, every region', async (_, raw) => {
    const location = await read(raw)
    expect(location.filtered).toBe(false)
    expect(location.feedLocation).toEqual([])
  })
})
