/**
 * Search area: a centre and a radius in the new design («Москва · 10 км»),
 * stored the old way — map centre, zoom and the square the feed is filtered by
 * (`<address>_location`), so the old app reads the same filter.
 */

import {
  boundsAround,
  decodeGeohash,
  distanceKm,
  encodeGeohash,
  fromLeafletBounds,
  toLeafletBounds,
  type LatLng,
  type LeafletBoundsJson,
} from './geohash'

export const RADIUS_PRESETS = [2, 5, 10, 25, 50] as const
export const DEFAULT_RADIUS = 10

export interface Area {
  center: LatLng
  radiusKm: number
}

interface StoredShape {
  geohash: string | null
  zoom: number | null
  bounds: LeafletBoundsJson | null
}

/**
 * Zoom the old map would show this area at. The old app warned when saving a
 * region closer than zoom 12, so small radii stay at 12–13.
 */
export function zoomForRadius(radiusKm: number): number {
  if (radiusKm <= 2) return 13
  if (radiusKm <= 5) return 12
  if (radiusKm <= 10) return 11
  if (radiusKm <= 25) return 10
  if (radiusKm <= 50) return 9
  return 8
}

export function storedFromArea(area: Area): StoredShape {
  return {
    geohash: encodeGeohash(area.center, 9),
    zoom: zoomForRadius(area.radiusKm),
    bounds: toLeafletBounds(boundsAround(area.center, area.radiusKm * 2)),
  }
}

/**
 * The area of a stored filter. The old app saved the visible part of the map
 * as a square, so its half-side is the radius.
 */
export function areaFromStored(stored: StoredShape): Area | null {
  if (stored.bounds) {
    const b = fromLeafletBounds(stored.bounds)
    const center: LatLng = [(b.south + b.north) / 2, (b.west + b.east) / 2]
    const half = distanceKm([b.south, center[1]], [b.north, center[1]]) / 2
    return { center, radiusKm: Math.max(0.5, Math.round(half * 10) / 10) }
  }
  const center = stored.geohash ? decodeGeohash(stored.geohash) : null
  return center ? { center, radiusKm: DEFAULT_RADIUS } : null
}

/** The preset chip to highlight: the nearest one, when it is close enough. */
export function radiusPreset(radiusKm: number): number | null {
  const nearest = RADIUS_PRESETS.reduce((a, b) =>
    Math.abs(b - radiusKm) < Math.abs(a - radiusKm) ? b : a
  )
  return Math.abs(nearest - radiusKm) <= nearest * 0.15 ? nearest : null
}

/** «10 км», «2,5 км», «800 м». */
export function formatRadius(radiusKm: number, locale: string, units: { km: string; m: string }) {
  if (radiusKm < 1) return `${Math.round(radiusKm * 1000)} ${units.m}`
  const value = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(radiusKm)
  return `${value} ${units.km}`
}

/** Distance on a card: «1,8 км», «350 м»; whole kilometres from 10 on — «160 км», not «160,4 км». */
export function formatDistance(km: number, locale: string, units: { km: string; m: string }) {
  return formatRadius(km >= 10 ? Math.round(km) : km, locale, units)
}

/**
 * Centre of the map when nothing is stored and the device location is
 * unknown. The old app looked the time zone up in `city-timezones` (about
 * 1 MB); a short table of the zones Barteron users live in does the same for
 * them, and the rest start from the zone's region.
 */
const ZONES: Record<string, LatLng> = {
  'Europe/Moscow': [55.7558, 37.6173],
  'Europe/Kaliningrad': [54.7104, 20.4522],
  'Europe/Samara': [53.1959, 50.1002],
  'Europe/Volgograd': [48.708, 44.5133],
  'Europe/Saratov': [51.5331, 46.0342],
  'Europe/Kirov': [58.6035, 49.668],
  'Europe/Astrakhan': [46.3497, 48.0408],
  'Europe/Ulyanovsk': [54.3142, 48.4031],
  'Asia/Yekaterinburg': [56.8389, 60.6057],
  'Asia/Omsk': [54.9885, 73.3242],
  'Asia/Novosibirsk': [55.0084, 82.9357],
  'Asia/Barnaul': [53.3561, 83.7496],
  'Asia/Tomsk': [56.4846, 84.9476],
  'Asia/Novokuznetsk': [53.7557, 87.1099],
  'Asia/Krasnoyarsk': [56.0153, 92.8932],
  'Asia/Irkutsk': [52.2869, 104.305],
  'Asia/Chita': [52.0515, 113.4712],
  'Asia/Yakutsk': [62.0355, 129.6755],
  'Asia/Vladivostok': [43.1155, 131.8855],
  'Asia/Magadan': [59.5682, 150.8085],
  'Asia/Sakhalin': [46.9591, 142.738],
  'Asia/Kamchatka': [53.0452, 158.6483],
  'Europe/Simferopol': [44.9521, 34.1024],
  'Europe/Minsk': [53.9006, 27.559],
  'Europe/Kiev': [50.4501, 30.5234],
  'Europe/Kyiv': [50.4501, 30.5234],
  'Europe/Chisinau': [47.0105, 28.8638],
  'Europe/Belgrade': [44.8125, 20.4612],
  'Europe/Podgorica': [42.4304, 19.2594],
  'Europe/Sarajevo': [43.8563, 18.4131],
  'Europe/Zagreb': [45.815, 15.9819],
  'Europe/Ljubljana': [46.0569, 14.5058],
  'Europe/Skopje': [41.9981, 21.4254],
  'Europe/Sofia': [42.6977, 23.3219],
  'Europe/Bucharest': [44.4268, 26.1025],
  'Europe/Budapest': [47.4979, 19.0402],
  'Europe/Warsaw': [52.2297, 21.0122],
  'Europe/Prague': [50.0755, 14.4378],
  'Europe/Vienna': [48.2082, 16.3738],
  'Europe/Berlin': [52.52, 13.405],
  'Europe/Paris': [48.8566, 2.3522],
  'Europe/London': [51.5074, -0.1278],
  'Europe/Madrid': [40.4168, -3.7038],
  'Europe/Rome': [41.9028, 12.4964],
  'Europe/Istanbul': [41.0082, 28.9784],
  'Europe/Riga': [56.9496, 24.1052],
  'Europe/Vilnius': [54.6872, 25.2797],
  'Europe/Tallinn': [59.437, 24.7536],
  'Europe/Helsinki': [60.1699, 24.9384],
  'Asia/Tbilisi': [41.7151, 44.8271],
  'Asia/Yerevan': [40.1792, 44.4991],
  'Asia/Baku': [40.4093, 49.8671],
  'Asia/Almaty': [43.2389, 76.8897],
  'Asia/Qostanay': [53.2144, 63.6246],
  'Asia/Aqtobe': [50.2839, 57.1669],
  'Asia/Tashkent': [41.2995, 69.2401],
  'Asia/Bishkek': [42.8746, 74.5698],
  'Asia/Dushanbe': [38.5598, 68.787],
  'Asia/Ashgabat': [37.9601, 58.3261],
  'Asia/Dubai': [25.2048, 55.2708],
  'Asia/Jerusalem': [31.7683, 35.2137],
  'Asia/Bangkok': [13.7563, 100.5018],
  'Asia/Shanghai': [31.2304, 121.4737],
  'America/New_York': [40.7128, -74.006],
  'America/Toronto': [43.6532, -79.3832],
  'America/Chicago': [41.8781, -87.6298],
  'America/Denver': [39.7392, -104.9903],
  'America/Phoenix': [33.4484, -112.074],
  'America/Los_Angeles': [34.0522, -118.2437],
  'America/Vancouver': [49.2827, -123.1207],
  'America/Edmonton': [53.5461, -113.4938],
  'America/Winnipeg': [49.8951, -97.1384],
  'America/Halifax': [44.6488, -63.5752],
  'America/Anchorage': [61.2181, -149.9003],
  'Pacific/Honolulu': [21.3069, -157.8583],
}

const REGIONS: Record<string, LatLng> = {
  Europe: [50.1109, 8.6821],
  Asia: [43.2389, 76.8897],
  America: [39.8283, -98.5795],
  Africa: [1.6508, 17.6791],
  Australia: [-33.8688, 151.2093],
  Pacific: [21.3069, -157.8583],
}

export function centerForTimeZone(zone: string | undefined): LatLng {
  if (zone && ZONES[zone]) return ZONES[zone]!
  const region = zone?.split('/')[0]
  return (region && REGIONS[region]) || ZONES['Europe/Moscow']!
}

export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}
