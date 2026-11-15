import { useQueries } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { keys, useBarteron, useCategories, useFeed, useGroups } from '@/api/queries'
import type { FeedRequest } from '@/api/barteron'
import type { Area } from '@/lib/area'
import {
  NEARBY_PAGE,
  inDistrict,
  joinPlaces,
  nearbyPlace,
  nearestCells,
  summarizeNearby,
  type NearbyPlace,
} from '@/models/nearby'
import type { Offer } from '@/models/offer'
import { useLocationStore } from '@/stores/location'

/**
 * «Что продают рядом»: the newest offers of the search area (the same place
 * filter as every list), summed up by category, district and seller.
 * One page of `NEARBY_PAGE`: `complete` tells whether that was all of them.
 */
export function useNearby(district: MaybeRefOrGetter<string | null> = null) {
  const location = useLocationStore()
  const categories = useCategories()
  const area = computed<Area | null>(() => (location.filtered ? location.area : null))

  const request = computed<FeedRequest | null>(() =>
    area.value
      ? {
          location: [...location.feedLocation],
          orderBy: 'height',
          orderDesc: true,
          pageSize: NEARBY_PAGE,
        }
      : null
  )
  // Under the feed key: a published offer refreshes it like the other lists.
  const feed = useFeed(request)
  const first = computed(() => feed.data.value?.pages[0] ?? null)

  function summarize(offers: readonly Offer[]) {
    const tree = categories.tree.value
    if (!area.value || !tree) return null
    return summarizeNearby(offers, {
      center: area.value.center,
      radiusKm: area.value.radiusKm,
      rootOf: (tag) => (tree.get(tag) ? (tree.parents(tag)[0]?.id ?? tag) : null),
    })
  }

  const summary = computed(() => (first.value ? summarize(first.value.offers) : null))
  /** The chosen district's offers, summed up the same way; the whole area without one. */
  const scoped = computed(() => {
    const cell = toValue(district)
    const s = summary.value
    if (!s || !cell || !s.districts.some((d) => d.cell === cell)) return s
    return summarize(inDistrict(s.offers, cell))
  })
  const error = computed(() => {
    if (!area.value) return null
    return (feed.isError.value ? feed.error.value : null) ?? categories.error.value ?? null
  })

  return {
    area,
    summary,
    scoped,
    /** Every offer of the area was read, not only the newest. */
    complete: computed(() => !!first.value && first.value.received < NEARBY_PAGE),
    loading: computed(() => !!area.value && !summary.value && !error.value),
    /** The offers or the category tree they are summed up by did not come. */
    error,
    retry: () => {
      if (feed.isError.value) void feed.refetch()
      categories.retry()
    },
  }
}

/** Cells asked when the area is empty (a town often spans several), and offers read from each. */
const PLACE_CELLS = 6
const PLACE_PAGE = 30
/** Places shown. */
const PLACE_LIMIT = 3

/**
 * Where the nearest offers are when the area has none: the node's counts by
 * 4 geohash letters (about 40×20 km) point at cells, and each cell is read
 * to see whether the catalog would show anything there.
 */
export function useNearestPlaces(area: MaybeRefOrGetter<Area | null>) {
  const barteron = useBarteron()
  const groups = useGroups(() => (toValue(area) ? { locationGroup: 4 } : null))
  const cells = computed(() => {
    const a = toValue(area)
    return a && groups.data.value ? nearestCells(groups.data.value, a.center, PLACE_CELLS) : []
  })

  const checks = useQueries({
    queries: computed(() =>
      cells.value.map((cell) => ({
        queryKey: keys.nearbyPlace(cell),
        enabled: !!barteron.value,
        staleTime: 5 * 60_000,
        queryFn: () =>
          barteron.value!.api.feedPage({
            location: [cell],
            orderBy: 'height',
            orderDesc: true,
            pageSize: PLACE_PAGE,
          }),
      }))
    ),
  })

  const places = computed<NearbyPlace[]>(() => {
    const a = toValue(area)
    if (!a) return []
    const found = cells.value.flatMap((cell, i) => {
      const page = checks.value[i]?.data
      const place = page
        ? nearbyPlace(cell, page.offers, {
            full: page.received >= PLACE_PAGE,
            center: a.center,
            radiusKm: a.radiusKm,
          })
        : null
      return place ? [place] : []
    })
    return joinPlaces(found, a.center).slice(0, PLACE_LIMIT)
  })

  return {
    places,
    loading: computed(
      () =>
        !!toValue(area) &&
        (groups.isPending.value ||
          checks.value.some((q) => q.isPending && q.fetchStatus !== 'idle'))
    ),
  }
}
