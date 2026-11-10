import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { placeName, reverseGeocode } from '@/api/geo'
import { decodeGeohash } from '@/lib/geohash'
import { useSessionStore } from '@/stores/session'

/**
 * «Москва, Таганская площадь» for the offer's point. Nominatim, one request
 * per spot (8 geohash characters, about 20 m) and language; only inside
 * Bastyon — the mock stays offline.
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
    queryFn: async () => {
      const found = await reverseGeocode(point.value!, { locale: locale.value, zoom: 17 })
      return found ? placeName(found.raw) : null
    },
  })
}
