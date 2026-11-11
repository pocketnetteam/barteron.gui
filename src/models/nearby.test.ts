import { describe, expect, it } from 'vitest'
import { encodeGeohash, type LatLng } from '@/lib/geohash'
import {
  direction,
  districtPrecision,
  inDistrict,
  joinPlaces,
  nearbyPlace,
  nearestCells,
  summarizeNearby,
  type NearbyOptions,
} from './nearby'
import { emptyOffer, type Offer } from './offer'

const NOW = Date.UTC(2026, 10, 11)
const HOUR = 3_600_000
const MOSCOW: LatLng = [55.7558, 37.6173]
const NORTH: LatLng = [55.795, 37.6173] // about 4.4 km north
const EAST: LatLng = [55.7558, 37.69] // about 4.5 km east

let n = 0
function offer(at: LatLng, tag: number | null, address: string, extra: Partial<Offer> = {}): Offer {
  n++
  return {
    ...emptyOffer(address, 'ru-RU', NOW - n * HOUR),
    hash: n.toString(16).padStart(64, '0'),
    tag,
    geohash: encodeGeohash(at),
    ...extra,
  }
}

/** Categories 7001 and 7002 are electronics (7000), 1003 is bikes (1000). */
const options: NearbyOptions = {
  center: MOSCOW,
  radiusKm: 10,
  rootOf: (tag) => ({ 7001: 7000, 7002: 7000, 1003: 1000, 1000: 1000 })[tag] ?? null,
  now: NOW,
}

describe('direction', () => {
  it.each([
    [NORTH, 'n'],
    [EAST, 'e'],
    [[55.72, 37.55] as LatLng, 'sw'],
    [[55.79, 37.68] as LatLng, 'ne'],
  ])('%j is %s of the centre', (to, expected) => {
    expect(direction(MOSCOW, to)).toBe(expected)
  })
})

describe('district size', () => {
  it('follows the radius', () => {
    expect([2, 5, 10, 25, 50].map(districtPrecision)).toEqual([6, 6, 5, 5, 4])
  })
})

describe('summarizeNearby', () => {
  it('counts only what the catalog shows', () => {
    const shown = offer(MOSCOW, 7001, 'PA')
    const withdrawn = offer(MOSCOW, 7001, 'PA', { published: 'withdrawed' })
    const removed = offer(MOSCOW, 7001, 'PA', { published: 'removed' })
    const expired = offer(MOSCOW, 7001, 'PA', { till: NOW - 1 })
    const s = summarizeNearby([withdrawn, shown, removed, expired], options)
    expect(s.offers).toEqual([shown])
    expect(s.categories).toEqual([{ id: 7000, count: 1, offers: [shown] }])
  })

  it('groups by top category, the biggest first, offers newest first', () => {
    const bike = offer(MOSCOW, 1003, 'PA')
    const phone = offer(MOSCOW, 7001, 'PB')
    const laptop = offer(MOSCOW, 7002, 'PC')
    const unknown = offer(MOSCOW, 99999, 'PC')
    const s = summarizeNearby([laptop, bike, unknown, phone], options)
    expect(s.categories.map((c) => [c.id, c.count])).toEqual([
      [7000, 2],
      [1000, 1],
    ])
    expect(s.categories[0]!.offers).toEqual([phone, laptop])
    // An unknown category is still an offer nearby.
    expect(s.offers).toHaveLength(4)
  })

  it('districts: count, direction, distance, categories', () => {
    const items = [
      offer(NORTH, 7001, 'PA'),
      offer(NORTH, 7002, 'PB'),
      offer(NORTH, 1003, 'PB'),
      offer(EAST, 1003, 'PC'),
      offer(MOSCOW, 1003, 'PC'),
    ]
    const s = summarizeNearby(items, options)
    expect(s.districts.map((d) => [d.count, d.direction])).toEqual([
      [3, 'n'],
      [1, null],
      [1, 'e'],
    ])
    const north = s.districts[0]!
    expect(north.cell).toHaveLength(5)
    expect(north.distanceKm).toBeGreaterThan(4)
    expect(north.distanceKm).toBeLessThan(5)
    expect(north.categories).toEqual([7000, 1000])
    expect(inDistrict(s.offers, north.cell)).toHaveLength(3)
  })

  it('an offer without a place is counted but has no district', () => {
    const s = summarizeNearby([offer(MOSCOW, 1003, 'PA', { geohash: '' })], options)
    expect(s.offers).toHaveLength(1)
    expect(s.districts).toEqual([])
  })

  it('sellers: the most offers first, with their categories', () => {
    const s = summarizeNearby(
      [
        offer(MOSCOW, 1003, 'PA'),
        offer(MOSCOW, 7001, 'PB'),
        offer(MOSCOW, 7002, 'PB'),
        offer(MOSCOW, 1003, 'PB'),
      ],
      options
    )
    expect(s.sellers).toEqual([
      { address: 'PB', count: 3, categories: [7000, 1000] },
      { address: 'PA', count: 1, categories: [1000] },
    ])
  })
})

describe('places when the area is empty', () => {
  const SPB = encodeGeohash([59.94, 30.31], 4)
  const TVER = encodeGeohash([56.86, 35.92], 4)
  const HERE = encodeGeohash(MOSCOW, 4)

  it('cells nearest first, the one under the area too', () => {
    const groups = [
      { location: SPB, count: 460 },
      { location: TVER, count: 59 },
      { location: HERE, count: 1500 },
      { location: '', count: 3 },
      { location: encodeGeohash([54.71, 20.45], 4), count: 0 },
    ]
    expect(nearestCells(groups, MOSCOW, 5)).toEqual([HERE, TVER, SPB])
    expect(nearestCells(groups, MOSCOW, 1)).toEqual([HERE])
  })

  it('a checked cell: shown offers outside the area, where and how far', () => {
    const tver: LatLng = [56.86, 35.92]
    const shown = [offer(tver, 1003, 'PA'), offer([56.87, 35.93], 7001, 'PB')]
    const hidden = offer(tver, 1003, 'PA', { published: 'withdrawed' })
    const read = { full: false, center: MOSCOW, radiusKm: 10, now: NOW }
    const place = nearbyPlace(TVER, [...shown, hidden], read)!
    expect(place).toMatchObject({ cell: TVER, count: 2, more: false, direction: 'nw' })
    expect(place.distanceKm).toBeGreaterThan(150)
    expect(place.distanceKm).toBeLessThan(170)
    expect(nearbyPlace(TVER, [hidden], read)).toBeNull()
    // Inside the area there is nothing to show: that is why the cell was asked.
    expect(nearbyPlace(HERE, [offer(MOSCOW, 1003, 'PA')], read)).toBeNull()
    expect(nearbyPlace(TVER, shown, { ...read, full: true })!.more).toBe(true)
  })

  it('cells of one town become one place', () => {
    const read = { full: false, center: MOSCOW, radiusKm: 10, now: NOW }
    const a = nearbyPlace('a', [offer([56.86, 35.92], 1003, 'PA')], read)!
    const b = nearbyPlace('b', [offer([56.9, 35.85], 1003, 'PB')], { ...read, full: true })!
    const spb = nearbyPlace('c', [offer([59.94, 30.31], 1003, 'PC')], read)!
    const joined = joinPlaces([spb, b, a], MOSCOW)
    expect(joined.map((p) => [p.count, p.more])).toEqual([
      [2, true],
      [1, false],
    ])
    expect(joined[0]!.at[0]).toBeCloseTo(56.88, 2)
    expect(joined[0]!.direction).toBe('nw')
  })
})
