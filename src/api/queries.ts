/**
 * Data for screens: TanStack Query over `BarteronApi`. Lists seed the cache of
 * single offers, so an offer page opens at once from the feed; single loads
 * made close together go to the node as one request (`createBatcher`).
 */

import {
  keepPreviousData,
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
import { MOCK_ALLOWED } from '@/sdk/mock-allowed'
import type { AppInfo, HostSdk } from '@/sdk/types'
import { useNetStore } from '@/stores/net'
import { useSessionStore } from '@/stores/session'
import type { TrackedTx, useTxStore } from '@/stores/tx'
import {
  BarteronApi,
  type DealsRequest,
  type FeedRequest,
  type GroupsRequest,
  type OfferPage,
} from './barteron'
import { createBatcher } from './batch'
import { fetchRates } from './rates'
import { parseBalance } from './wallet'

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
  // Under `feeds`: a published offer refreshes deal lists too.
  deals: (request: DealsRequest | null) => ['barteron', 'feed', 'deals', request] as const,
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
  balance: (address: string | null) => ['bastyon', 'balance', address] as const,
  /** Transfers of a safe deal and the chain height. */
  deal: (id: string | null) => ['barteron', 'deal', id] as const,
  /** Offers of safe deals, banned sellers too: apart from `offer`, which hides them. */
  dealOffers: (ids: readonly string[]) => ['barteron', 'deal-offers', [...ids]] as const,
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

export function barteronFor(
  sdk: HostSdk,
  brighteon = false,
  onRpc?: (answered: boolean) => void
): Barteron {
  const cached = perSdk.get(sdk)
  if (cached) return cached
  const api = new BarteronApi(sdk, {
    brighteon,
    limitLocation: (location) => limitToArea(location, CANADA_USA),
    onRpc,
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
  const net = useNetStore()
  return computed(() =>
    session.sdk ? barteronFor(session.sdk, isBrighteon(session.appinfo), net.report) : null
  )
}

export function seedOffers(client: QueryClient, offers: readonly Offer[]) {
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

/** PKOIN balance of the signed-in user; the host pushes `balance` when it changes. */
export function useBalance() {
  const session = useSessionStore()
  return useQuery({
    queryKey: computed(() => keys.balance(session.address)),
    enabled: computed(() => !!session.sdk && session.account === 'signed-in'),
    queryFn: async () => parseBalance(await session.sdk!.get.balance()),
    staleTime: 60_000,
  })
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
      MOCK_ALLOWED && session.mode === 'mock'
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
      // «Мой список» decides what my offers with «my list» match.
      invalidate(keys.feeds)
      break
    case 'review':
    case 'vote':
      invalidate(keys.offerDetails(tx.target))
      invalidate(keys.score(tx.target))
      invalidate(['barteron', 'offers-details'])
      break
    case 'payment':
      // A safe deal transfer is in a block: read the deal again.
      if (tx.target) invalidate(keys.deal(tx.target))
      invalidate(keys.balance(me))
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

/** Several offers by id at once: pickup points of an offer. */
export function useOffersByIds(ids: MaybeRefOrGetter<readonly string[]>) {
  const barteron = useBarteron()
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => ['barteron', 'offers-by-ids', [...toValue(ids)]]),
    enabled: computed(() => !!barteron.value && toValue(ids).length > 0),
    // A list that loses one id (a favourite removed) keeps showing the rest.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const found = await barteron.value!.api.offersByIds(toValue(ids))
      for (const o of found) if (o.hash) client.setQueryData(keys.offer(o.hash), o)
      return found
    },
  })
}

/**
 * Offers of safe deals by id, banned sellers included: a deal under way stays
 * open to its guarantor (`BarteronApi.offersByIds`, `withBanned`). Nothing
 * goes to the cache of offer pages, where a banned offer is «not found».
 * `keepPrevious` — for a list: one more deal does not blank the rest.
 */
export function useDealOffers(ids: MaybeRefOrGetter<readonly string[]>, keepPrevious = false) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => keys.dealOffers(toValue(ids))),
    enabled: computed(() => !!barteron.value && toValue(ids).length > 0),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    queryFn: () => barteron.value!.api.offersByIds(toValue(ids), { withBanned: true }),
  })
}

/** Bastyon names and avatars of several users: authors of reviews. */
export function useUserProfiles(addresses: MaybeRefOrGetter<readonly string[]>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => ['bastyon', 'profiles', [...toValue(addresses)].sort()]),
    enabled: computed(() => !!barteron.value && toValue(addresses).length > 0),
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const list = await barteron.value!.api.userProfiles(toValue(addresses))
      return new Map(list.map((p) => [p.address, p]))
    },
  })
}

/** Scores and reviews of several offers at once: everything said about a seller. */
export function useOffersDetails(ids: MaybeRefOrGetter<readonly string[]>) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: computed(() => ['barteron', 'offers-details', [...toValue(ids)].sort()]),
    enabled: computed(() => !!barteron.value && toValue(ids).length > 0),
    queryFn: () =>
      barteron.value!.api.offerDetails({
        offerIds: [...toValue(ids)],
        includeAccounts: false,
        includeCommentScores: false,
      }),
  })
}
