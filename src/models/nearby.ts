import { decodeGeohash, distanceKm, type LatLng } from '@/lib/geohash'
import type { OfferGroup } from '@/api/barteron'
import { isOfferActive, type Offer } from './offer'

/**
 * «Что продают рядом» (stage 10): what is sold around the search area, by
 * category, district and seller.
 *
 * Counted from the newest offers of the area, not from `getbarterongroups`.
 * On mainnet (11.11) the node's counts include withdrawn and expired offers
 * the catalog hides: 59 against 4 visible in one town, 355 against 266 in a
 * city. One page of 200 comes in 2–4 s; every next page is slower, and past
 * a few hundred the node times out — so a busy area is summed up by its newest
 * offers, and the page says so.
 */
export const NEARBY_PAGE = 200

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
const DIRECTIONS: readonly Direction[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']

/** Compass direction from one point to another, in eighths. */
export function direction(from: LatLng, to: LatLng): Direction {
  const rad = Math.PI / 180
  const [lat1, lat2] = [from[0] * rad, to[0] * rad]
  const dLng = (to[1] - from[1]) * rad
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = (Math.atan2(y, x) / rad + 360) % 360
  return DIRECTIONS[Math.round(bearing / 45) % 8]!
}

/**
 * Geohash length of a district: about 1×0.6 km for a radius up to 5 km,
 * 5×5 km up to 25 km, 39×20 km beyond — a dozen or two districts a screen.
 */
export function districtPrecision(radiusKm: number): number {
  if (radiusKm <= 5) return 6
  if (radiusKm <= 25) return 5
  return 4
}

export interface NearbyCategory {
  /** Top-level category. */
  id: number
  count: number
  /** Newest first. */
  offers: Offer[]
}

export interface NearbyDistrict {
  /** Geohash prefix of the district. */
  cell: string
  /** Middle of its offers: a dot on the map. */
  at: LatLng
  count: number
  distanceKm: number
  /** `null` — the district is at the centre of the area. */
  direction: Direction | null
  /** Top-level categories, the most offers first. */
  categories: number[]
}

export interface NearbySeller {
  address: string
  count: number
  /** Top-level categories, the most offers first. */
  categories: number[]
}

export interface NearbySummary {
  /** Offers the catalog would show, newest first. */
  offers: Offer[]
  categories: NearbyCategory[]
  districts: NearbyDistrict[]
  sellers: NearbySeller[]
}

export interface NearbyOptions {
  center: LatLng
  radiusKm: number
  /** Top-level category of a category id; `null` — an unknown id. */
  rootOf: (tag: number) => number | null
  now?: number
}

/** Keys by how many items they have, then by first appearance. */
function ranked<K>(counts: Map<K, number>): K[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
}

const bump = <K>(map: Map<K, number>, key: K) => map.set(key, (map.get(key) ?? 0) + 1)

/** A district this close to the centre is «в центре», not «0,3 км к северу». */
const centreKm = (radiusKm: number) => Math.max(0.5, radiusKm * 0.1)

/**
 * What is sold around: only offers the catalog shows (published, not expired;
 * banned authors are already dropped by the API), newest first.
 */
export function summarizeNearby(all: readonly Offer[], options: NearbyOptions): NearbySummary {
  const now = options.now ?? Date.now()
  const offers = all.filter((o) => isOfferActive(o, now)).sort((a, b) => b.time - a.time)
  const precision = districtPrecision(options.radiusKm)

  interface Group {
    points: LatLng[]
    tags: Map<number, number>
  }
  const categories = new Map<number, NearbyCategory>()
  const districts = new Map<string, Group>()
  const sellers = new Map<string, { count: number; tags: Map<number, number> }>()

  for (const offer of offers) {
    const root = offer.tag === null ? null : options.rootOf(offer.tag)
    if (root !== null) {
      const c = categories.get(root) ?? { id: root, count: 0, offers: [] }
      c.count++
      c.offers.push(offer)
      categories.set(root, c)
    }

    const seller = sellers.get(offer.address) ?? { count: 0, tags: new Map<number, number>() }
    seller.count++
    if (root !== null) bump(seller.tags, root)
    sellers.set(offer.address, seller)

    const at = decodeGeohash(offer.geohash)
    if (!at || offer.geohash.length < precision) continue
    const cell = offer.geohash.slice(0, precision)
    const d: Group = districts.get(cell) ?? { points: [], tags: new Map() }
    d.points.push(at)
    if (root !== null) bump(d.tags, root)
    districts.set(cell, d)
  }

  return {
    offers,
    categories: [...categories.values()].sort((a, b) => b.count - a.count),
    districts: [...districts.entries()]
      .map(([cell, d]): NearbyDistrict => {
        const at: LatLng = [
          d.points.reduce((s, p) => s + p[0], 0) / d.points.length,
          d.points.reduce((s, p) => s + p[1], 0) / d.points.length,
        ]
        const km = distanceKm(options.center, at)
        return {
          cell,
          at,
          count: d.points.length,
          distanceKm: km,
          direction: km < centreKm(options.radiusKm) ? null : direction(options.center, at),
          categories: ranked(d.tags),
        }
      })
      .sort((a, b) => b.count - a.count || a.distanceKm - b.distanceKm),
    sellers: [...sellers.entries()]
      .map(([address, s]) => ({ address, count: s.count, categories: ranked(s.tags) }))
      .sort((a, b) => b.count - a.count),
  }
}

/** Offers of one district. */
export const inDistrict = (offers: readonly Offer[], cell: string): Offer[] =>
  offers.filter((o) => o.geohash.startsWith(cell))

/**
 * Where something may be sold when the area is empty: cells of
 * `getbarterongroups`, nearest first. A cell may cover the area itself and
 * still hold offers just outside it. Counts include withdrawn and expired
 * offers, so each cell is checked with the feed (`nearbyPlace`) before it is
 * shown.
 */
export function nearestCells(
  groups: readonly OfferGroup[],
  center: LatLng,
  limit: number
): string[] {
  return groups
    .flatMap((g) => {
      const at = g.location && g.count > 0 ? decodeGeohash(g.location) : null
      return at ? [{ cell: g.location, km: distanceKm(center, at) }] : []
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map((c) => c.cell)
}

export interface NearbyPlace {
  cell: string
  /** Middle of the offers found. */
  at: LatLng
  /** Offers the catalog shows, of those read. */
  count: number
  /** Fewer were read than the cell holds: «30+». */
  more: boolean
  distanceKm: number
  direction: Direction
}

/**
 * A checked cell: its offers the catalog shows, outside the area (inside it
 * there are none — that is why the cell was asked). `null` — nothing to show.
 */
export function nearbyPlace(
  cell: string,
  offers: readonly Offer[],
  read: { full: boolean; center: LatLng; radiusKm: number; now?: number }
): NearbyPlace | null {
  const now = read.now ?? Date.now()
  const points = offers.flatMap((o) => {
    const at = isOfferActive(o, now) ? decodeGeohash(o.geohash) : null
    return at && distanceKm(read.center, at) > read.radiusKm ? [at] : []
  })
  if (!points.length) return null
  const at: LatLng = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
  ]
  return {
    cell,
    at,
    count: points.length,
    more: read.full,
    distanceKm: distanceKm(read.center, at),
    direction: direction(read.center, at),
  }
}

/**
 * A town often spans several cells: places closer than `km` to each other
 * become one, nearest first.
 */
export function joinPlaces(places: readonly NearbyPlace[], center: LatLng, km = 30): NearbyPlace[] {
  const joined: NearbyPlace[] = []
  for (const p of [...places].sort((a, b) => a.distanceKm - b.distanceKm)) {
    const near = joined.find((j) => distanceKm(j.at, p.at) < km)
    if (!near) {
      joined.push({ ...p })
      continue
    }
    const total = near.count + p.count
    near.at = [
      (near.at[0] * near.count + p.at[0] * p.count) / total,
      (near.at[1] * near.count + p.at[1] * p.count) / total,
    ]
    near.count = total
    near.more ||= p.more
    near.distanceKm = distanceKm(center, near.at)
    near.direction = direction(center, near.at)
  }
  return joined.sort((a, b) => a.distanceKm - b.distanceKm)
}
