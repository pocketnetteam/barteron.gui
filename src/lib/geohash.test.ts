import { describe, expect, it } from 'vitest'
import {
  approximateBounds,
  boundsAround,
  CANADA_USA,
  decodeGeohash,
  distanceKm,
  encodeGeohash,
  fromLeafletBounds,
  geohashBounds,
  limitToArea,
  toLeafletBounds,
} from './geohash'

describe('geohash', () => {
  it('encodes a place like offers store it and decodes it back', () => {
    // The mainnet offer in offer.test.ts sits at ucfsmxzf7gs3 (Moscow region).
    const point = decodeGeohash('ucfsmxzf7gs3')!
    expect(point[0]).toBeCloseTo(55.75, 0)
    expect(encodeGeohash(point)).toBe('ucfsmxzf7gs3')
    expect(decodeGeohash('not a hash!')).toBeNull()
  })

  it('covers a city view with a short list of prefixes', () => {
    const area = boundsAround([44.8125, 20.4612], 20)
    const prefixes = approximateBounds(area)
    expect(prefixes.length).toBeGreaterThan(0)
    expect(prefixes.length).toBeLessThanOrEqual(300)
    // The centre is inside one of them.
    const centre = encodeGeohash([44.8125, 20.4612])
    expect(prefixes.some((p) => centre.startsWith(p))).toBe(true)
    // Nothing far away.
    expect(prefixes.some((p) => encodeGeohash([55.75, 37.62]).startsWith(p))).toBe(false)
  })

  it('a whole geohash cell is one prefix', () => {
    const cell = geohashBounds('u0')
    const shrunk = { ...cell, north: cell.north - 1e-9, south: cell.south + 1e-9 }
    expect(approximateBounds(shrunk, { maxCount: 40 }).every((p) => p.startsWith('u0'))).toBe(true)
  })

  it('stores bounds in the old Leaflet shape', () => {
    const b = { south: 1, west: 2, north: 3, east: 4 }
    expect(toLeafletBounds(b)).toEqual({
      _southWest: { lat: 1, lng: 2 },
      _northEast: { lat: 3, lng: 4 },
    })
    expect(fromLeafletBounds(toLeafletBounds(b))).toEqual(b)
  })

  it('limits a request to Canada and the USA (Brighteon)', () => {
    expect(limitToArea([], CANADA_USA)).toEqual(CANADA_USA)
    // Inside an allowed cell: kept as is.
    expect(limitToArea(['9q8yy'], CANADA_USA)).toEqual(['9q8yy'])
    // Wider than allowed cells: narrowed to them.
    expect(limitToArea(['b5'], CANADA_USA)).toEqual(['b5x', 'b5m', 'b5q', 'b5r', 'b5n', 'b5p'])
    // Europe: nothing left.
    expect(limitToArea(['u0'], CANADA_USA)).toEqual([])
  })

  it('distance Belgrade — Novi Sad is about 70 km', () => {
    expect(distanceKm([44.8125, 20.4612], [45.2671, 19.8335])).toBeGreaterThan(65)
    expect(distanceKm([44.8125, 20.4612], [45.2671, 19.8335])).toBeLessThan(80)
  })
})
