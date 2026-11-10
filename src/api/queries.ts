/**
 * Data for screens: TanStack Query over `BarteronApi`. Lists seed the cache of
 * single offers, so an offer page opens at once from the feed; single loads
 * made close together go to the node as one request (`createBatcher`).
 */

import {
  QueryClient,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { CANADA_USA, limitToArea } from '@/lib/geohash'
import type { Locale } from '@/i18n'
import { emptyAccount, type BarteronAccount } from '@/models/account'
import { loadCategoryNames, loadCategoryTree } from '@/models/categories'
import type { Offer } from '@/models/offer'
import type { UserProfile } from '@/models/profile'
import { averageScore, type AverageScore } from '@/models/review'
import type { AppInfo, HostSdk } from '@/sdk/types'
import { useSessionStore } from '@/stores/session'
import type { TrackedTx, useTxStore } from '@/stores/tx'
import {
  BarteronApi,
  type ComplexDealsRequest,
  type DealsRequest,
  type FeedRequest,
  type GroupsRequest,
  type OfferPage,
} from './barteron'
import { createBatcher } from './batch'
import { fetchRates } from './rates'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: 1,
        // Focus moves between the host and the iframe all the time.
        refetchOnWindowFocus: false,
      },
    },
  })
}

export const keys = {
  all: ['barteron'] as const,
  feeds: ['barteron', 'feed'] as const,
  feed: (request: FeedRequest | null) => ['barteron', 'feed', request] as const,
  deals: (request: DealsRequest | null) => ['barteron', 'deals', request] as const,
  complexDeals: (request: ComplexDealsRequest | null) =>
    ['barteron', 'complex-deals', request] as const,
  groups: (request: GroupsRequest | null) => ['barteron', 'groups', request] as const,
  offersByAddress: (address: string | null) => ['barteron', 'offers-by', address] as const,
  offer: (id: string | null) => ['barteron', 'offer', id] as const,
  offerDetails: (id: string | null) => ['barteron', 'offer-details', id] as const,
  score: (id: string | null) => ['barteron', 'score', id] as const,
  account: (address: string | null) => ['barteron', 'account', address] as const,
  profile: (address: string | null) => ['bastyon', 'profile', address] as const,
  categoryTree: ['categories', 'tree'] as const,
  categoryNames: (locale: Locale) => ['categories', 'names', locale] as const,
  rates: ['rates'] as const,
}

/** Brighteon is the same app under another project: English, Canada and the USA. */
export const isBrighteon = (appinfo: AppInfo | null | undefined): boolean =>
  (appinfo?.project?.name ?? '').toLowerCase() === 'brighteon'

interface Barteron {
  api: BarteronApi
  offer: (id: string) => Promise<Offer | undefined>
  account: (address: string) => Promise<BarteronAccount | undefined>
  profile: (address: string) => Promise<UserProfile | undefined>
  score: (id: string) => Promise<AverageScore | undefined>
}

const perSdk = new WeakMap<HostSdk, Barteron>()

export function barteronFor(sdk: HostSdk, brighteon = false): Barteron {
  const cached = perSdk.get(sdk)
  if (cached) return cached
  const api = new BarteronApi(sdk, {
    brighteon,
    limitLocation: (location) => limitToArea(location, CANADA_USA),
  })
  const byKey = <T>(items: T[], key: (item: T) => string | null) =>
    new Map(items.flatMap((item) => (key(item) ? [[key(item)!, item] as const] : [])))
  const barteron: Barteron = {
    api,
    offer: createBatcher(async (ids) => byKey(await api.offersByIds(ids), (o) => o.hash)),
    account: createBatcher(async (addresses) =>
      byKey(await api.accounts(addresses), (a) => a.address)
    ),
    profile: createBatcher(async (addresses) =>
      byKey(await api.userProfiles(addresses), (p) => p.address)
    ),
    score: createBatcher(async (ids) => {
      const { scores } = await api.offerDetails({
        offerIds: ids,
        includeAccounts: false,
        includeScores: true,
        includeComments: false,
        includeCommentScores: false,
      })
      return new Map(ids.map((id) => [id, averageScore(scores.filter((s) => s.offerId === id))]))
    }),
  }
  perSdk.set(sdk, barteron)
  return barteron
}

/** Barteron reads for the connected host; `null` until the session is ready. */
export function useBarteron() {
  const session = useSessionStore()
  return computed(() =>
    session.sdk ? barteronFor(session.sdk, isBrighteon(session.appinfo)) : null
  )
}

function seedOffers(client: QueryClient, offers: readonly Offer[]) {
  for (const offer of offers) {
    if (offer.hash) client.setQueryData(keys.offer(offer.hash), offer)
  }
}

interface PageParam {
  pageStart: number
  topHeight?: number
}

export interface FeedPage extends OfferPage {
  /** Height the first page was read at; later pages ask for the same. */
  topHeight?: number
}

/** Ordered by height, newest first: later pages must not shift as new offers arrive. */
const pinsHeight = (request: FeedRequest | DealsRequest) =>
  (request.orderBy ?? 'height') === 'height' && (request.orderDesc ?? true)

function useOfferPages<R extends FeedRequest | DealsRequest>(
  key: (request: R | null) => readonly unknown[],
  request: MaybeRefOrGetter<R | null>,
  load: (barteron: Barteron, request: R) => Promise<OfferPage>
) {
  const barteron = useBarteron()
  const client = useQueryClient()
  return useInfiniteQuery({
    queryKey: computed(() => key(toValue(request))),
    enabled: computed(() => !!barteron.value && !!toValue(request)),
    initialPageParam: { pageStart: 0 } as PageParam,
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const base = toValue(request)!
      const result = await load(barteron.value!, {
        ...base,
        pageStart: pageParam.pageStart,
        topHeight: pageParam.topHeight ?? base.topHeight,
      })
      seedOffers(client, result.offers)
      const topHeight =
        pageParam.topHeight ??
        (pinsHeight(base) ? (result.offers[0]?.height ?? undefined) : undefined)
      return { ...result, topHeight }
    },
    getNextPageParam: (last, pages, lastParam): PageParam | undefined => {
      const size = toValue(request)?.pageSize ?? 10
      if (last.received < size) return undefined
      return { pageStart: lastParam.pageStart + 1, topHeight: pages[0]?.topHeight }
    },
  })
}

/** All offers of the loaded pages, without repeats. */
export function pagesOffers(data: InfiniteData<FeedPage> | undefined): Offer[] {
  const seen = new Set<string>()
  return (data?.pages ?? []).flatMap((p) =>
    p.offers.filter((o) => {
      const id = o.hash ?? ''
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  )
}

/** Catalog and search: `getbarteronfeed`, page by page («Показать ещё»). */
export const useFeed = (request: MaybeRefOrGetter<FeedRequest | null>) =>
  useOfferPages(keys.feed, request, (b, r) => b.api.feedPage(r))

/** Offers that fit my exchange list: `getbarterondeals`, page by page. */
export const useDeals = (request: MaybeRefOrGetter<DealsRequest | null>) =>
  useOfferPages(keys.deals, request, (b, r) => b.api.dealsPage(r))

export function useComplexDeals(request: MaybeRefOrGetter<ComplexDealsRequest | null>) {
  const barteron = useBarteron()
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => keys.complexDeals(toValue(request))),
    enabled: computed(() => !!barteron.value && !!toValue(request)),
    queryFn: async () => {
      const deals = await barteron.value!.api.complexDeals(toValue(request)!)
      seedOffers(
        client,
        deals.flatMap((d) => [d.target, ...d.intermediates])
      )
      return deals
    },
  })
}

/** «Что продают рядом»: counts by area (stage 10). */
export function useGroups(request: MaybeRefOrGetter<GroupsRequest | null>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.groups(toValue(request))),
    enabled: computed(() => !!barteron.value && !!toValue(request)),
    queryFn: () => barteron.value!.api.groups(toValue(request)!),
  })
}

export function useOffersByAddress(address: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => keys.offersByAddress(toValue(address) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(address)),
    queryFn: async () => {
      const offers = await barteron.value!.api.offersByAddress(toValue(address)!)
      seedOffers(client, offers)
      return offers
    },
  })
}

/** One offer by id; `null` — the node does not know it (removed or never published). */
export function useOffer(id: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.offer(toValue(id) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(id)),
    queryFn: async () => (await barteron.value!.offer(toValue(id)!)) ?? null,
  })
}

/** Scores, reviews and their authors for the offer page. */
export function useOfferDetails(id: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.offerDetails(toValue(id) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(id)),
    queryFn: () => barteron.value!.api.offerDetails({ offerIds: [toValue(id)!] }),
  })
}

/** Average score for a card. The old app kept these for 12 hours. */
export function useAverageScore(id: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.score(toValue(id) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(id)),
    staleTime: 12 * 60 * 60_000,
    queryFn: async () => (await barteron.value!.score(toValue(id)!)) ?? { value: 0, count: 0 },
  })
}

/** Barteron profile; an address without one gets an empty profile. */
export function useAccount(address: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.account(toValue(address) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(address)),
    queryFn: async () => {
      const value = toValue(address)!
      return (await barteron.value!.account(value)) ?? emptyAccount(value)
    },
  })
}

/** Bastyon name and avatar; `null` — no such user. */
export function useUserProfile(address: MaybeRefOrGetter<string | null | undefined>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.profile(toValue(address) ?? null)),
    enabled: computed(() => !!barteron.value && !!toValue(address)),
    staleTime: 10 * 60_000,
    queryFn: async () => (await barteron.value!.profile(toValue(address)!)) ?? null,
  })
}

/** Category tree and names in the interface language; both load once, lazily. */
export function useCategories() {
  const { locale } = useI18n()
  const tree = useQuery({
    queryKey: keys.categoryTree,
    queryFn: loadCategoryTree,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const names = useQuery({
    queryKey: computed(() => keys.categoryNames(locale.value as Locale)),
    queryFn: () => loadCategoryNames(locale.value as Locale),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const label = (id: number | null | undefined, preview = false): string | null =>
    tree.data.value && names.data.value
      ? tree.data.value.label(id, names.data.value, preview)
      : null
  return {
    tree: computed(() => tree.data.value ?? null),
    names: computed(() => names.data.value ?? null),
    ready: computed(() => !!tree.data.value && !!names.data.value),
    error: computed(() => tree.error.value ?? names.error.value),
    label,
  }
}

/**
 * PKOIN rates. `isError` — say «курс не загрузился» and keep the PKOIN price.
 * The old app retried after 10 seconds.
 */
export function useRates() {
  const session = useSessionStore()
  return useQuery({
    queryKey: keys.rates,
    // The mock (plain browser, e2e) uses fixed rates and stays offline.
    queryFn: () =>
      session.mode === 'mock'
        ? import('@/sdk/mock-data').then((m) => ({ ...m.DEMO_RATES }))
        : fetchRates(),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
    retryDelay: 10_000,
  })
}

/** Once a transaction is in a block, the data it changed is read again. */
export function refreshAfterTx(
  client: QueryClient,
  tx: Pick<TrackedTx, 'kind' | 'target' | 'status'>,
  me: string | null
): void {
  if (tx.status !== 'done') return
  const invalidate = (queryKey: readonly unknown[]) => void client.invalidateQueries({ queryKey })
  switch (tx.kind) {
    case 'offer':
    case 'offerRemove':
      invalidate(keys.offer(tx.target))
      invalidate(keys.offersByAddress(me))
      invalidate(keys.feeds)
      break
    case 'account':
      invalidate(keys.account(tx.target))
      break
    case 'review':
    case 'vote':
      invalidate(keys.offerDetails(tx.target))
      invalidate(keys.score(tx.target))
      break
    case 'payment':
      break
  }
}

export function installTxRefresh(
  client: QueryClient,
  txStore: ReturnType<typeof useTxStore>,
  me: () => string | null
): () => void {
  return txStore.subscribe((tx) => refreshAfterTx(client, tx, me()))
}
