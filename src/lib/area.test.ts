import { describe, expect, it } from 'vitest'
import {
  areaFromStored,
  centerForTimeZone,
  formatRadius,
  radiusPreset,
  storedFromArea,
  zoomForRadius,
} from './area'
import { decodeGeohash, distanceKm } from './geohash'

const MOSCOW: [number, number] = [55.7558, 37.6173]
const UNITS = { km: 'км', m: 'м' }

describe('search area in the old storage format', () => {
  it('centre and radius go to a square twice the radius; and back', () => {
    const stored = storedFromArea({ center: MOSCOW, radiusKm: 10 })
    const b = stored.bounds!
    expect(distanceKm([b._southWest.lat, MOSCOW[1]], [b._northEast.lat, MOSCOW[1]])).toBeCloseTo(
      20,
      1
    )
    expect(stored.zoom).toBe(11)
    const center = decodeGeohash(stored.geohash!)!
    expect(distanceKm(center, MOSCOW)).toBeLessThan(0.01)

    const area = areaFromStored(stored)!
    expect(distanceKm(area.center, MOSCOW)).toBeLessThan(0.01)
    expect(area.radiusKm).toBeCloseTo(10, 0)
  })

  it('an old filter (visible map square) becomes a centre and a radius', () => {
    const old = {
      geohash: 'ucfv0',
      zoom: 11,
      bounds: { _southWest: { lat: 55.6, lng: 37.4 }, _northEast: { lat: 55.9, lng: 37.85 } },
    }
    const area = areaFromStored(old)!
    expect(area.center[0]).toBeCloseTo(55.75, 2)
    expect(area.radiusKm).toBeCloseTo(16.7, 0)
    expect(areaFromStored({ geohash: 'ucfv0', zoom: 11, bounds: null })?.radiusKm).toBe(10)
    expect(areaFromStored({ geohash: null, zoom: null, bounds: null })).toBeNull()
  })

  it('preset chips, zoom and labels', () => {
    expect(radiusPreset(10.4)).toBe(10)
    expect(radiusPreset(16.7)).toBeNull()
    expect(zoomForRadius(2)).toBe(13)
    expect(zoomForRadius(50)).toBe(9)
    expect(formatRadius(2.5, 'ru', UNITS)).toBe('2,5 км')
    expect(formatRadius(0.8, 'ru', UNITS)).toBe('800 м')
  })

  it('default centre by time zone, region, or Moscow', () => {
    expect(centerForTimeZone('Europe/Belgrade')).toEqual([44.8125, 20.4612])
    expect(centerForTimeZone('America/Argentina/Buenos_Aires')[1]).toBeLessThan(0)
    expect(centerForTimeZone(undefined)).toEqual(MOSCOW)
  })
})
