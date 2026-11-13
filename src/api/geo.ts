/**
 * Place: the device location through Bastyon and addresses through
 * Nominatim (OpenStreetMap), as in the old app (`requestUserLocation`,
 * `geoLocation`, leaflet-geosearch's OpenStreetMapProvider,
 * `src/js/addressUtils.js`).
 *
 * Nominatim is an outside service: requests go through the Bastyon fetch
 * tunnel when the host enables it (see `public/miniapp-service-worker.js`).
 * It allows one request a second from an address, so every request of the
 * app waits in one queue; the address search goes first.
 */

import type { LatLng } from '@/lib/geohash'
import { createPacer } from '@/lib/pace'
import type { HostSdk } from '@/sdk/types'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
let nominatimQueue = createPacer(1000)

/** A request Nominatim has not answered by then is given up: it must not hold the queue. */
export const NOMINATIM_TIMEOUT_MS = 15_000
/**
 * After a refusal or no answer, background requests (place names) wait this
 * long, longer each time in a row; the address search still goes. A refusal
 * (429) shows in a browser as a failed request: Nominatim sends it without
 * CORS headers. Repeating at once would only keep the block on (PLAN, risk 12).
 */
export const NOMINATIM_BACKOFF_MS = [30_000, 60_000, 120_000, 300_000] as const
let failuresInRow = 0
let pausedUntil = 0

/** A fresh queue, no refusals, no kept searches: for tests. */
export function resetNominatimPause(): void {
  failuresInRow = 0
  pausedUntil = 0
  searches.clear()
  nominatimQueue = createPacer(1000)
}

/** The device location; the previous Bastyon asks the browser with no time limit. */
export const GEOLOCATION_TIMEOUT_MS = 20_000

/** Coordinates from `get.geolocation()`: bastyon-nextgen answers `{latitude, longitude}`. */
export function parseHostLocation(value: unknown): LatLng | null {
  let lat: unknown
  let lng: unknown
  if (Array.isArray(value)) {
    ;[lat, lng] = value
  } else if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    lat = v.latitude ?? v.lat
    lng = v.longitude ?? v.lng ?? v.lon
    // Old hosts: any object of two numbers, read like `Object.values(location)`.
    if (lat === undefined && lng === undefined) [lat, lng] = Object.values(v)
  }
  const point = [Number(lat), Number(lng)] as LatLng
  return point.every(Number.isFinite) && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180
    ? point
    : null
}

export type GeolocationResult =
  { status: 'ok'; point: LatLng } | { status: 'denied' } | { status: 'failed'; error: unknown }

/**
 * The device location. Asks Bastyon for the `geolocation` permission only
 * when `ask` is set: on load the app uses it silently if granted earlier.
 */
export async function requestGeolocation(sdk: HostSdk, ask: boolean): Promise<GeolocationResult> {
  let granted = await sdk.permissions.check({ permission: 'geolocation' }).catch(() => false)
  if (!granted && ask) {
    await sdk.permissions.request(['geolocation']).catch(() => undefined)
    granted = await sdk.permissions.check({ permission: 'geolocation' }).catch(() => false)
  }
  if (!granted) return { status: 'denied' }
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('geolocation_timeout')), GEOLOCATION_TIMEOUT_MS)
  })
  try {
    const point = parseHostLocation(await Promise.race([sdk.get.geolocation(), timeout]))
    return point ? { status: 'ok', point } : { status: 'failed', error: new Error('bad_location') }
  } catch (error) {
    return { status: 'failed', error }
  } finally {
    clearTimeout(timer)
  }
}

/** The part of a Nominatim answer the app reads. */
export interface NominatimPlace {
  lat: string
  lon: string
  display_name?: string
  address?: Record<string, string | undefined>
  boundingbox?: [string, string, string, string]
}

export interface FoundPlace {
  point: LatLng
  label: string
  raw: NominatimPlace
}

type Fetch = typeof fetch

const paused = (urgent: boolean) => !urgent && Date.now() < pausedUntil

/** A refusal or no answer: the service is busy or blocks us. A bad query is not one. */
const isRefusal = (error: unknown) => {
  const status = /^nominatim_(\d+)$/.exec((error as Error)?.message ?? '')?.[1]
  return !status || Number(status) === 429 || Number(status) >= 500
}

function getJson(
  url: string,
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  urgent: boolean
): Promise<unknown> {
  if (paused(urgent)) return Promise.reject(new Error('nominatim_paused'))
  return nominatimQueue(
    async () => {
      if (paused(urgent)) throw new Error('nominatim_paused')
      const controller = new AbortController()
      const stop = () => controller.abort()
      signal?.addEventListener('abort', stop, { once: true })
      const timer = setTimeout(stop, NOMINATIM_TIMEOUT_MS)
      try {
        const response = await fetcher(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`nominatim_${response.status}`)
        const data: unknown = await response.json()
        failuresInRow = 0
        pausedUntil = 0
        return data
      } catch (error) {
        // Left by the screen: not the service's fault.
        if (signal?.aborted) throw error
        const reason = controller.signal.aborted ? new Error('nominatim_timeout') : error
        if (isRefusal(reason)) {
          const wait =
            NOMINATIM_BACKOFF_MS[Math.min(failuresInRow, NOMINATIM_BACKOFF_MS.length - 1)]!
          failuresInRow++
          pausedUntil = Date.now() + wait
        }
        throw reason
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener('abort', stop)
      }
    },
    { signal, urgent }
  )
}

/** Only the string parts of an answer: names go into text and into `toLowerCase`. */
function strings(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )
}

const toPlace = (value: unknown, options?: AddressFormatOptions): FoundPlace | null => {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  const point: LatLng = [Number(v.lat), Number(v.lon)]
  if (!point.every(Number.isFinite)) return null
  const raw: NominatimPlace = {
    lat: String(v.lat),
    lon: String(v.lon),
    display_name: typeof v.display_name === 'string' ? v.display_name : undefined,
    address: strings(v.address),
  }
  return { point, label: formatAddress(raw, options), raw }
}

/** Searches already answered: Nominatim asks to keep results, not to ask again. */
const searches = new Map<string, FoundPlace[]>()
const SEARCHES_KEPT = 50

export interface SearchOptions {
  /** Interface language for the names. */
  locale?: string
  limit?: number
  signal?: AbortSignal
  fetcher?: Fetch
}

export async function searchAddress(
  query: string,
  options: SearchOptions = {}
): Promise<FoundPlace[]> {
  const q = query.trim()
  if (!q) return []
  const params = new URLSearchParams({
    format: 'json',
    q,
    addressdetails: '1',
    limit: String(options.limit ?? 5),
    ...(options.locale && { 'accept-language': options.locale }),
  })
  const key = params.toString()
  const kept = searches.get(key)
  if (kept) return kept
  const data = await getJson(
    `${NOMINATIM}/search?${params}`,
    options.fetcher ?? fetch,
    options.signal,
    true
  )
  const found = (Array.isArray(data) ? data : [])
    .map((raw) => toPlace(raw))
    .filter((p): p is FoundPlace => !!p)
  if (searches.size >= SEARCHES_KEPT) searches.delete(searches.keys().next().value!)
  searches.set(key, found)
  return found
}

export async function reverseGeocode(
  point: LatLng,
  options: Omit<SearchOptions, 'limit'> & { zoom?: number } = {}
): Promise<FoundPlace | null> {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(point[0]),
    lon: String(point[1]),
    zoom: String(options.zoom ?? 18),
    addressdetails: '1',
    ...(options.locale && { 'accept-language': options.locale }),
  })
  const data = await getJson(
    `${NOMINATIM}/reverse?${params}`,
    options.fetcher ?? fetch,
    options.signal,
    false
  )
  return toPlace(data)
}

export interface AddressFormatOptions {
  includeDistrict?: boolean
  includePostcode?: boolean
}

const SHORT: Record<string, Record<string, string>> = {
  ru: {
    область: 'обл.',
    район: 'р-н',
    административный: 'адм.',
    округ: 'окр.',
    улица: 'ул.',
    проспект: 'пр-т',
    переулок: 'пер.',
    площадь: 'пл.',
    шоссе: 'ш.',
    бульвар: 'б-р',
    строение: 'стр.',
    корпус: 'корп.',
  },
}

/**
 * Short address from Nominatim parts (old `formatAddress_OSM`): in Russia,
 * Ukraine and Belarus from country down to house, elsewhere from street up.
 */
export function formatAddress(place: NominatimPlace, options: AddressFormatOptions = {}): string {
  const a = place.address
  if (!a) return place.display_name ?? ''
  const country = a.country_code ?? ''
  const dict = SHORT[country]
  const shorten = (text: string) =>
    !text || !dict
      ? text
      : text
          .split(' ')
          .map((word) => dict[word.trim().toLowerCase()] ?? word.trim())
          .join(' ')

  const settlementRaw = a.city || a.town || a.village || a.hamlet || ''
  const regionRaw = a.state || ''
  const duplicateRegion =
    regionRaw.toLowerCase().includes(settlementRaw.toLowerCase()) ||
    settlementRaw
      .toLowerCase()
      .includes(regionRaw.toLowerCase().replace(' область', '').replace(' обл.', ''))

  const postcode = options.includePostcode ? (a.postcode ?? '') : ''
  const region = duplicateRegion ? '' : shorten(regionRaw)
  const settlement = shorten(settlementRaw)
  const district = options.includeDistrict ? shorten(a.suburb || a.city_district || '') : ''
  const road = shorten(a.road || '')
  const house = a.house_number || ''

  const parts = ['ru', 'ua', 'by'].includes(country)
    ? [postcode, a.country, region, settlement, district, road, house]
    : [road, house, district, settlement, region, postcode, a.country]

  return [...new Set(parts.filter((p): p is string => !!p))].join(', ')
}

/** City and district: «Москва, район Таганский». */
export function areaName(place: NominatimPlace): string | null {
  const a = place.address ?? {}
  const city = a.city || a.town || a.village || a.hamlet || a.state || ''
  const district = a.suburb || a.city_district || a.district || ''
  return [city, district].filter(Boolean).join(', ') || null
}

/** City and street or square, without the house: «Москва, Таганская площадь». */
export function placeName(place: NominatimPlace): string | null {
  const a = place.address ?? {}
  const city = a.city || a.town || a.village || a.hamlet || a.state || ''
  const spot = a.road || a.square || a.pedestrian || a.suburb || a.neighbourhood || ''
  return [city, spot].filter(Boolean).join(', ') || null
}

/** A district of a city, else the town: «Таганский», «Химки». */
export function districtName(place: NominatimPlace): string | null {
  const a = place.address ?? {}
  return (
    a.suburb ||
    a.city_district ||
    a.quarter ||
    a.neighbourhood ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.city ||
    null
  )
}

/** Just the city, for a seller's profile: «Москва». */
export function cityName(place: NominatimPlace): string | null {
  const a = place.address ?? {}
  return a.city || a.town || a.village || a.hamlet || a.state || null
}
