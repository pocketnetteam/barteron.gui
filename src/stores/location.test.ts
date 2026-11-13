import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
