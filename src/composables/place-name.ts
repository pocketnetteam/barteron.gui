import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { cityName, districtName, placeName, reverseGeocode } from '@/api/geo'
import { decodeGeohash, encodeGeohash, type LatLng } from '@/lib/geohash'
import { useSessionStore } from '@/stores/session'

/**
 * «Москва, Таганская площадь» for the offer's point. Nominatim, one request
 * per spot (8 geohash characters, about 20 m) and language; only inside
 * Bastyon — the mock stays offline. Nominatim requests wait in one queue,
 * a second apart (`@/api/geo`); a screen that is left takes its requests out.
 */
export function usePlaceName(geohash: MaybeRefOrGetter<string | null | undefined>) {
  const { locale } = useI18n()
  const session = useSessionStore()
  const point = computed(() => decodeGeohash(toValue(geohash) ?? ''))
  const key = computed(() => (toValue(geohash) ?? '').slice(0, 8))
  return useQuery({
    queryKey: computed(() => ['geo', 'place', key.value, locale.value]),
    enabled: computed(() => session.mode === 'bastyon' && !!point.value),
    staleTime: Infinity,
    retry: 1,
    queryFn: async ({ signal }) => {
      const found = await reverseGeocode(point.value!, { locale: locale.value, zoom: 17, signal })
      return found ? placeName(found.raw) : null
    },
  })
}

/**
 * «Таганский» for a district of «Что продают рядом»: the suburb or city
 * district, else the town. One request per area of about 1 km and language;
 * Bastyon only. `null` as the point — no name needed.
 */
export function useDistrictName(point: MaybeRefOrGetter<LatLng | null>) {
  const { locale } = useI18n()
  const session = useSessionStore()
  const at = computed(() => toValue(point))
  const key = computed(() => (at.value ? encodeGeohash(at.value, 6) : ''))
  return useQuery({
    queryKey: computed(() => ['geo', 'district', key.value, locale.value]),
    enabled: computed(() => session.mode === 'bastyon' && !!at.value),
    staleTime: Infinity,
    retry: 1,
    retryDelay: 2000,
    queryFn: async ({ signal }) => {
      const found = await reverseGeocode(at.value!, { locale: locale.value, zoom: 14, signal })
      return found ? districtName(found.raw) : null
    },
  })
}

/**
 * The city of a profile's place (old profile: «country, city»; the mockup has
 * the city). One request per area of about 5 km and language; Bastyon only.
 */
export function useCityName(geohash: MaybeRefOrGetter<string | null | undefined>) {
  const { locale } = useI18n()
  const session = useSessionStore()
  const key = computed(() => (toValue(geohash) ?? '').slice(0, 5))
  const point = computed(() => decodeGeohash(key.value))
  return useQuery({
    queryKey: computed(() => ['geo', 'city', key.value, locale.value]),
    enabled: computed(() => session.mode === 'bastyon' && !!point.value),
    staleTime: Infinity,
    retry: 1,
    queryFn: async ({ signal }) => {
      const found = await reverseGeocode(point.value!, { locale: locale.value, zoom: 10, signal })
      return found ? cityName(found.raw) : null
    },
  })
}
