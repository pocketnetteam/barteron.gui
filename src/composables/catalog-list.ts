import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { pagesOffers, useDeals, useFeed } from '@/api/queries'
import {
  hasLocalFilters,
  matchesLocalFilters,
  type CatalogFilters,
  type CatalogRequest,
} from '@/models/filters'
import { isOfferActive } from '@/models/offer'

/** Pages fetched on their own when the new filters hide almost everything. */
const AUTO_PAGES = 3
/** Fewer visible offers than this from a page — fetch the next one. */
const AUTO_BELOW = 4

/**
 * Offers of a catalog request, page by page. Only active offers are shown:
 * withdrawn and expired ones have no place in a list. Filters the node does
 * not know are applied here; when they hide most of a page, the next one is
 * fetched without a click, a few times at most.
 */
export function useCatalogList(
  request: MaybeRefOrGetter<CatalogRequest | null>,
  filters: MaybeRefOrGetter<CatalogFilters | null>
) {
  const req = computed(() => toValue(request))
  const feed = useFeed(() => (req.value?.kind === 'feed' ? req.value.request : null))
  const deals = useDeals(() => (req.value?.kind === 'deals' ? req.value.request : null))
  const query = computed(() => (req.value?.kind === 'deals' ? deals : feed))

  const offers = computed(() => {
    const f = toValue(filters)
    const all = pagesOffers(query.value.data.value).filter((o) => isOfferActive(o))
    return f && hasLocalFilters(f) ? all.filter((o) => matchesLocalFilters(o, f)) : all
  })

  const pages = computed(() => query.value.data.value?.pages.length ?? 0)
  const auto = ref(0)
  watch(
    () => [req.value, toValue(filters)] as const,
    () => (auto.value = 0),
    { deep: true }
  )
  watch(pages, (count, before) => {
    const f = toValue(filters)
    const q = query.value
    if (!f || !hasLocalFilters(f) || count <= (before ?? 0)) return
    const last = q.data.value?.pages.at(-1)
    const visible = (last?.offers ?? []).filter(
      (o) => isOfferActive(o) && matchesLocalFilters(o, f)
    ).length
    if (visible < AUTO_BELOW && q.hasNextPage.value && auto.value < AUTO_PAGES) {
      auto.value++
      void q.fetchNextPage()
    }
  })

  return {
    offers,
    /** First page on its way. */
    loading: computed(() => query.value.isPending.value && !!req.value),
    /** The first page failed: nothing to show. */
    error: computed(() =>
      query.value.isError.value && !pages.value ? query.value.error.value : null
    ),
    /** A later page failed: what is loaded stays. */
    moreError: computed(() =>
      query.value.isFetchNextPageError.value ? query.value.error.value : null
    ),
    hasMore: computed(() => !!query.value.hasNextPage.value),
    loadingMore: computed(() => query.value.isFetchingNextPage.value),
    /** Every page fetched and nothing else is coming. */
    complete: computed(
      () => !query.value.hasNextPage.value && !query.value.isFetching.value && pages.value > 0
    ),
    more: () => {
      auto.value = 0
      void query.value.fetchNextPage()
    },
    retry: () => void query.value.refetch(),
  }
}
