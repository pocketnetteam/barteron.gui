/**
 * Geohash helpers. Offers keep their place as a geohash (`p.s6`); the feed
 * filters by geohash prefixes. Ported from barteron.gui `src/js/geohashUtils.js`
 * on top of the same `ngeohash` library.
 */

import ngeohash from 'ngeohash'

export type LatLng = [lat: number, lng: number]

export interface Bounds {
  south: number
  west: number
  north: number
  east: number
}

/** Leaflet's `LatLngBounds` as the old app stored it in localStorage. */
export interface LeafletBoundsJson {
  _southWest: { lat: number; lng: number }
  _northEast: { lat: number; lng: number }
}

export const fromLeafletBounds = (b: LeafletBoundsJson): Bounds => ({
  south: b._southWest.lat,
  west: b._southWest.lng,
  north: b._northEast.lat,
  east: b._northEast.lng,
})

export const toLeafletBounds = (b: Bounds): LeafletBoundsJson => ({
  _southWest: { lat: b.south, lng: b.west },
  _northEast: { lat: b.north, lng: b.east },
})

/** Offers are written with 12 characters (about 4 cm). */
export const OFFER_PRECISION = 12

export const encodeGeohash = (point: LatLng, precision = OFFER_PRECISION): string =>
  ngeohash.encode(point[0], point[1], precision)

export function decodeGeohash(hash: string): LatLng | null {
  if (!hash || !/^[0-9b-hjkmnp-z]+$/.test(hash)) return null
  const { latitude, longitude } = ngeohash.decode(hash)
  return [latitude, longitude]
}

export function geohashBounds(hash: string): Bounds {
  const [south, west, north, east] = ngeohash.decode_bbox(hash)
  return { south, west, north, east }
}

const geohashesIn = (b: Bounds, precision: number): string[] =>
  ngeohash.bboxes(b.south, b.west, b.north, b.east, precision)

const covers = (outer: Bounds, inner: Bounds) =>
  outer.north >= inner.north &&
  outer.east >= inner.east &&
  outer.south <= inner.south &&
  outer.west <= inner.west

const same = (a: Bounds, b: Bounds) =>
  a.north === b.north && a.east === b.east && a.south === b.south && a.west === b.west

const outside = (cell: Bounds, area: Bounds) =>
  cell.south >= area.north ||
  cell.west >= area.east ||
  cell.north <= area.south ||
  cell.east <= area.west

const inside = (cell: Bounds, area: Bounds) => covers(area, cell)

export interface ApproximationOptions {
  /** The node takes a list of prefixes; keep it short. */
  maxCount?: number
  maxPrecision?: number
}

/**
 * Geohash prefixes that cover the visible area, as fine as `maxCount` allows
 * (old `GeoHashApproximator`). The feed's `location` filter takes them.
 */
export function approximateBounds(area: Bounds, options: ApproximationOptions = {}): string[] {
  const maxCount = options.maxCount ?? 300
  const maxPrecision = options.maxPrecision ?? 7
  let precision = 1
  let result = geohashesIn(area, precision)

  for (;;) {
    const next: string[] = []
    const added = new Set<string>()
    for (const hash of result) {
      const cell = geohashBounds(hash)
      const intersects = !covers(cell, area) && !outside(cell, area) && !inside(cell, area)
      if ((covers(cell, area) && !same(cell, area)) || intersects) {
        for (const child of geohashesIn(cell, precision + 1)) {
          if (child.startsWith(hash) && !added.has(child) && !outside(geohashBounds(child), area)) {
            added.add(child)
            next.push(child)
          }
        }
      } else if (inside(cell, area) && !added.has(hash)) {
        added.add(hash)
        next.push(hash)
      }
    }
    if (next.length <= maxCount && precision < maxPrecision) {
      result = next
      precision++
    } else {
      return result
    }
  }
}

/** A square `sideKm` wide around a point (old `GeohashBoundsHelper`). */
export function boundsAround([lat, lng]: LatLng, sideKm: number): Bounds {
  const R = 6371
  const latPerKm = 180 / (Math.PI * R)
  const lngPerKm = 360 / (2 * Math.PI * Math.cos((lat * Math.PI) / 180) * R)
  const dLat = (latPerKm * sideKm) / 2
  const dLng = (lngPerKm * sideKm) / 2
  return { south: lat - dLat, west: lng - dLng, north: lat + dLat, east: lng + dLng }
}

/** Great-circle distance, km: «3,2 км» on a card. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLng = (b[1] - a[1]) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Brighteon: geohash cells of Canada and the USA (old `GeoHashLimitator`, «Canada,USA»). */
export const CANADA_USA = [
  'bk,bs,bu,b7,be,bg,b6,bd,bf,b1,b3,b9',
  'b5x,b5m,b5q,b5r,b5n,b5p',
  'zc',
  'c',
  'fn,fq,fw,fj,fm,fh,fk,fs,f5,f7,fe,f4,f6,fd,f1,f3,f9,fc,f0,f2,f8,fb',
  '87,8e',
  '9p,9r,9x,9z,9n,9q,9w,9y,9m,9t,9v,9u',
  'dp,dr,dx,dn,dq,dj,dh',
].flatMap((group) => group.split(','))

/**
 * Keeps only the parts of `location` inside `area`; an empty `location` means
 * the whole area. Same rules as the old `GeoHashLimitator.limit`.
 */
export function limitToArea(location: readonly string[], area: readonly string[]): string[] {
  if (!location.length) return [...area]
  const result: string[] = []
  for (const item of location) {
    for (const allowed of area) {
      if (item.length >= allowed.length) {
        if (item.startsWith(allowed)) {
          result.push(item)
          break
        }
      } else if (allowed.startsWith(item)) {
        result.push(allowed)
      }
    }
  }
  return result
}
