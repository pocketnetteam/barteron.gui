import { describe, expect, it } from 'vitest'
import {
  approximateBounds,
  boundsAround,
  BRIGHTEON_BOX,
  BRIGHTEON_CENTER,
  CANADA_USA,
  decodeGeohash,
  distanceKm,
  encodeGeohash,
  fitBrighteon,
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

  it('Brighteon cells are the old «Canada,USA» list, all 63', () => {
    expect(CANADA_USA.join(',')).toBe(
      'bk,bs,bu,b7,be,bg,b6,bd,bf,b1,b3,b9,b5x,b5m,b5q,b5r,b5n,b5p,zc,c,' +
        'fn,fq,fw,fj,fm,fh,fk,fs,f5,f7,fe,f4,f6,fd,f1,f3,f9,fc,f0,f2,f8,fb,87,8e,' +
        '9p,9r,9x,9z,9n,9q,9w,9y,9m,9t,9v,9u,dp,dr,dx,dn,dq,dj,dh'
    )
  })

  it('Brighteon default place: inside the box stays, outside or none is its centre (old `fixLocationIfNeeded`)', () => {
    expect(fitBrighteon([40.7128, -74.006])).toEqual([40.7128, -74.006])
    expect(fitBrighteon([BRIGHTEON_BOX.minLat, BRIGHTEON_BOX.maxLng])).toEqual([
      BRIGHTEON_BOX.minLat,
      BRIGHTEON_BOX.maxLng,
    ])
    for (const away of [
      [55.7558, 37.6173],
      [BRIGHTEON_BOX.minLat - 0.01, -100],
      [BRIGHTEON_BOX.maxLat + 0.01, -100],
      [40, BRIGHTEON_BOX.minLng - 0.01],
      [40, BRIGHTEON_BOX.maxLng + 0.01],
    ] as const) {
      expect(fitBrighteon([...away])).toEqual(BRIGHTEON_CENTER)
    }
    expect(fitBrighteon(null)).toEqual([44.966667, -103.766667])
  })

  it('distance Belgrade — Novi Sad is about 70 km', () => {
    expect(distanceKm([44.8125, 20.4612], [45.2671, 19.8335])).toBeGreaterThan(65)
    expect(distanceKm([44.8125, 20.4612], [45.2671, 19.8335])).toBeLessThan(80)
  })
})

describe('at the edges of the map', () => {
  type Point = [number, number]
  /** Whether an offer at this point falls into the prefixes. */
  const finds = (prefixes: string[], point: Point) =>
    prefixes.some((p) => encodeGeohash(point).startsWith(p))

  it('a view across the antimeridian covers both sides', () => {
    // Leaflet keeps counting past 180: 170…190 is 170…180 and −180…−170.
    const view = approximateBounds({ south: 60, west: 170, north: 70, east: 190 })
    expect(finds(view, [65, 175])).toBe(true)
    expect(finds(view, [65, -175])).toBe(true)
    expect(finds(view, [65, -160])).toBe(false)
    expect(view.length).toBeLessThanOrEqual(300)
    // Each side gets half of the limit: together no more than asked.
    expect(
      approximateBounds({ south: 60, west: 170, north: 70, east: 190 }, { maxCount: 100 }).length
    ).toBeLessThanOrEqual(100)
    // The same place, counted the other way.
    const other = approximateBounds({ south: 60, west: -190, north: 70, east: -170 })
    expect(finds(other, [65, 175])).toBe(true)
    expect(finds(other, [65, -175])).toBe(true)
  })

  it('a view on the equator at Greenwich covers all four quarters', () => {
    const view = approximateBounds(boundsAround([0, 0], 2))
    for (const point of [
      [0.005, 0.005],
      [0.005, -0.005],
      [-0.005, 0.005],
      [-0.005, -0.005],
    ] as Point[])
      expect(finds(view, point)).toBe(true)
    expect(finds(view, [0.05, 0])).toBe(false)
  })

  it('a view wider than the world is the whole world', () => {
    const view = approximateBounds({ south: -85, west: -540, north: 85, east: 540 })
    for (const point of [
      [0, 0],
      [50, 179.9],
      [-50, -179.9],
    ] as Point[])
      expect(finds(view, point)).toBe(true)
    // One cell each, no repeats.
    expect(view).toHaveLength(32)
    expect(new Set(view).size).toBe(32)
  })

  it('broken bounds give no place filter, not a filter somewhere else', () => {
    expect(approximateBounds({ south: NaN, west: 0, north: 1, east: 1 })).toEqual([])
    expect(approximateBounds({ south: 1, west: 0, north: Infinity, east: 1 })).toEqual([])
  })

  it('bounds upside down are put right', () => {
    expect(approximateBounds({ south: 56, west: 37, north: 55, east: 38 })).toEqual(
      approximateBounds({ south: 55, west: 37, north: 56, east: 38 })
    )
  })

  it('a point picked past the antimeridian is stored where it really is', () => {
    expect(encodeGeohash([60, 190], 6)).toBe(encodeGeohash([60, -170], 6))
    expect(encodeGeohash([60, -200], 6)).toBe(encodeGeohash([60, 160], 6))
    expect(encodeGeohash([95, 10], 6)).toBe(encodeGeohash([90, 10], 6))
    // The edge itself and everything inside stay as they are.
    expect(encodeGeohash([0, 180], 6)).toBe('rzzzzz')
    expect(encodeGeohash([55.7558, 37.6173])).toBe('ucfv0n014d7y')
  })

  it('a square around a pole stays on the globe', () => {
    const b = boundsAround([89.99, 0], 10)
    expect(b.north).toBeLessThanOrEqual(90)
    expect(b.east - b.west).toBeLessThanOrEqual(360)
    expect(approximateBounds(b).length).toBeGreaterThan(0)
  })

  it('distances: across the antimeridian, along the equator, pole to pole', () => {
    expect(Math.round(distanceKm([0, 179.9], [0, -179.9]))).toBe(22)
    expect(Math.round(distanceKm([0, 0], [0, 1]))).toBe(111)
    expect(Math.round(distanceKm([90, 0], [-90, 0]))).toBe(20015)
    expect(distanceKm([55.75, 37.61], [55.75, 37.61])).toBe(0)
    // Nearly opposite points: rounding takes the sine past 1, the distance is still half the globe.
    expect(Math.round(distanceKm([-79.75, -179], [79.75, 1]))).toBe(20015)
  })
})
