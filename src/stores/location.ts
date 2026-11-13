import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { requestGeolocation, reverseGeocode, type NominatimPlace } from '@/api/geo'
import { isBrighteon } from '@/api/queries'
import { i18n } from '@/i18n'
import {
  areaFromStored,
  centerForTimeZone,
  deviceTimeZone,
  storedFromArea,
  type Area,
} from '@/lib/area'
import {
  approximateBounds,
  fitBrighteon,
  fromLeafletBounds,
  type LatLng,
  type LeafletBoundsJson,
} from '@/lib/geohash'
import { readStored, userKey, writeStored } from '@/lib/storage'
import { useSessionStore } from './session'

/** What the old app kept under `<address>_location`: the map view the feed is filtered by. */
export interface StoredLocation {
  /** Map centre. */
  geohash: string | null
  zoom: number | null
  /** Visible area; `null` — no place filter. */
  bounds: LeafletBoundsJson | null
}

const EMPTY: StoredLocation = { geohash: null, zoom: null, bounds: null }

function valid(value: unknown): StoredLocation {
  if (!value || typeof value !== 'object') return EMPTY
  const v = value as Partial<StoredLocation>
  const b = v.bounds
  const boundsOk =
    !!b &&
    [b._southWest?.lat, b._southWest?.lng, b._northEast?.lat, b._northEast?.lng].every(
      (n) => typeof n === 'number' && Number.isFinite(n)
    )
  return {
    geohash: typeof v.geohash === 'string' ? v.geohash : null,
    zoom: typeof v.zoom === 'number' ? v.zoom : null,
    bounds: boundsOk ? b! : null,
  }
}

/** City, town or region of a Nominatim place; the country when nothing else. */
export function cityOf(place: NominatimPlace): string | null {
  const a = place.address ?? {}
  return a.city || a.town || a.village || a.state || a.county || a.country || null
}

/** Place filter of the catalog and the device location. */
export const useLocationStore = defineStore('location', () => {
  const session = useSessionStore()
  const stored = ref<StoredLocation>(EMPTY)
  /** Device location from Bastyon, once known. */
  const device = shallowRef<LatLng | null>(null)
  const deviceStatus = ref<'unknown' | 'locating' | 'ok' | 'denied' | 'failed'>('unknown')

  watch(
    () => session.address,
    (address) => {
      stored.value = valid(readStored(userKey('location', address), EMPTY))
    },
    { immediate: true }
  )

  function save(value: StoredLocation) {
    stored.value = value
    writeStored(userKey('location', session.address), value)
  }

  function set(value: Partial<StoredLocation>) {
    save(valid({ ...stored.value, ...value }))
  }

  /** `onlyBounds` keeps the map view but drops the filter. */
  function reset(onlyBounds = false) {
    save(onlyBounds ? { ...stored.value, bounds: null } : EMPTY)
  }

  /** Centre and radius of the stored map view; also kept after «Все регионы». */
  const area = computed(() => areaFromStored(stored.value))

  /** Saves an area as the filter of every list. */
  function setArea(value: Area) {
    save(valid(storedFromArea(value)))
  }

  /**
   * Where a map opens: the stored centre, the device, or the time zone (old
   * `getDefaultLocation`). Brighteon shows Canada and the USA only, so the
   * time zone's place outside them gives way to their centre, as before.
   */
  const mapCenter = computed<LatLng>(() => {
    const known = area.value?.center ?? device.value
    if (known) return known
    const zone = centerForTimeZone(deviceTimeZone())
    return isBrighteon(session.appinfo) ? fitBrighteon(zone) : zone
  })

  /**
   * City of the area centre for «Москва · 10 км» (old `onlyCity`). One
   * Nominatim request per centre and language; the mock stays offline.
   */
  const placeName = ref<string | null>(null)
  let placeKey = ''
  watch(
    () => [area.value?.center.join(','), i18n.global.locale.value, session.mode] as const,
    async ([center, locale, mode]) => {
      const key = `${center}|${locale}`
      if (!center || key === placeKey) return
      placeKey = key
      placeName.value = null
      if (mode !== 'bastyon') return
      const place = await reverseGeocode(area.value!.center, { locale, zoom: 10 }).catch(() => null)
      if (placeKey === key) placeName.value = place ? cityOf(place.raw) : null
    },
    { immediate: true }
  )

  /** Geohash prefixes for `location` of feed requests; empty — everywhere. */
  const feedLocation = computed(() =>
    stored.value.bounds ? approximateBounds(fromLeafletBounds(stored.value.bounds)) : []
  )

  /** Asks Bastyon for the device location; `ask` shows the permission prompt if needed. */
  async function locate(ask = false): Promise<LatLng | null> {
    const sdk = session.sdk
    if (!sdk) return null
    deviceStatus.value = 'locating'
    const result = await requestGeolocation(sdk, ask)
    if (result.status === 'ok') {
      device.value = result.point
      deviceStatus.value = 'ok'
      return result.point
    }
    deviceStatus.value = result.status
    return null
  }

  return {
    stored,
    area,
    mapCenter,
    placeName,
    setArea,
    device,
    deviceStatus,
    feedLocation,
    filtered: computed(() => !!stored.value.bounds),
    set,
    reset,
    locate,
  }
})
