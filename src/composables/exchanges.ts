import { useQueries, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import {
  keys,
  seedOffers,
  useAccount,
  useBarteron,
  useCategories,
  useOffersByAddress,
  useUserProfiles,
} from '@/api/queries'
import { createLimiter } from '@/lib/limit'
import type { CategoryTree } from '@/models/categories'
import {
  exchangeCount,
  groupKey,
  matchGroupOf,
  matchGroups,
  noMatchReason,
  offerExchanges,
  type ExchangeChain,
  type GroupMatches,
  type MatchGroup,
  type NoMatchReason,
  type OfferExchanges,
} from '@/models/exchange'
import { isOfferActive, type Offer } from '@/models/offer'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'

/** Direct exchanges asked for one group; the old «Найти обмены» asked for 100 at once. */
export const DIRECT_PAGE = 48

/** At most three groups are asked at a time, so a long list of offers does not flood the node. */
const limit = createLimiter(3)

const STALE = 5 * 60_000

const expand = (tree: CategoryTree, ids: readonly number[]) => [
  ...new Set(ids.flatMap((id) => tree.withDescendants(id))),
]

/**
 * One group's direct exchanges and chains, in the search area of the
 * catalog. Direct: their offer is in a category I want (or under one) and
 * accepts my category or one above it — wider than the old page, which
 * asked for the exact categories. Chains: as the old ThreeSidedSearch asked.
 */
async function fetchGroup(
  api: NonNullable<ReturnType<typeof useBarteron>['value']>['api'],
  tree: CategoryTree,
  group: MatchGroup,
  owner: string,
  location: readonly string[]
): Promise<GroupMatches> {
  const where = location.length ? { location: [...location] } : {}
  const [page, chains] = await Promise.all([
    api.dealsPage({
      myTags: [group.myTag, ...tree.parents(group.myTag).map((c) => c.id)],
      theirTags: expand(tree, group.wish),
      excludeAddresses: [owner],
      pageSize: DIRECT_PAGE,
      ...where,
    }),
    api.complexDeals({
      myTag: group.myTag,
      theirTags: group.wish,
      excludeAddresses: [owner],
      ...where,
    }),
  ])
  return {
    direct: page.offers,
    more: page.received >= DIRECT_PAGE,
    chains: chains.map((c) => ({ target: c.target, intermediates: c.intermediates })),
  }
}

export type MatchStatus = 'none' | 'pending' | 'error' | 'ready'

export interface OfferMatchState {
  offer: Offer
  status: MatchStatus
  /** `status: 'none'` — why there is nothing to look for. */
  reason: NoMatchReason | null
  exchanges: OfferExchanges | null
  count: number | null
}

/**
 * Exchanges for offers of one owner. Offers with the same category and wish
 * list share a request, and the cache is shared by every screen: the home
 * page, my offer, «Мои объявления», the exchanges section and its pages.
 */
export function useMatchGroups(
  sources: MaybeRefOrGetter<readonly Offer[]>,
  /** The owner's profile list for «my list»; `null` while it loads. */
  ownerList: MaybeRefOrGetter<readonly number[] | null>,
  options: {
    maxGroups?: number
    /** Everywhere, not in my search area: a chain someone else sent me. */
    anywhere?: MaybeRefOrGetter<boolean>
    /** The owner's profile did not come: an error to retry, not waiting forever. */
    ownerListFailed?: MaybeRefOrGetter<boolean>
    retryOwnerList?: () => Promise<unknown>
  } = {}
) {
  const barteron = useBarteron()
  const client = useQueryClient()
  const categories = useCategories()
  const location = useLocationStore()

  const owner = computed(() => toValue(sources)[0]?.address ?? '')
  const where = computed(() => (toValue(options.anywhere) ? [] : location.feedLocation))
  const groups = computed(() => {
    const list = toValue(ownerList)
    if (!list) return []
    return matchGroups(toValue(sources), list).slice(0, options.maxGroups ?? Infinity)
  })

  const results = useQueries({
    queries: computed(() =>
      groups.value.map((group) => ({
        // Under `keys.feeds`: a new or changed offer refreshes the matches too.
        queryKey: keys.matches(groupKey(group), owner.value, where.value),
        queryFn: () =>
          limit(async () => {
            const raw = await fetchGroup(
              barteron.value!.api,
              categories.tree.value!,
              group,
              owner.value,
              where.value
            )
            seedOffers(client, [
              ...raw.direct,
              ...raw.chains.flatMap((c) => [c.target, ...c.intermediates]),
            ])
            return raw
          }),
        enabled: !!barteron.value && !!categories.tree.value && !!owner.value,
        staleTime: STALE,
      }))
    ),
  })

  const states = computed<OfferMatchState[]>(() => {
    const list = toValue(ownerList)
    const byKey = new Map(groups.value.map((g, i) => [groupKey(g), results.value[i]]))
    return toValue(sources).map((offer): OfferMatchState => {
      const empty = { offer, reason: null, exchanges: null, count: null }
      if (!list) return { ...empty, status: toValue(options.ownerListFailed) ? 'error' : 'pending' }
      const group = matchGroupOf(offer, list)
      if (!group) return { ...empty, status: 'none', reason: noMatchReason(offer, list) }
      const result = byKey.get(groupKey(group))
      if (!result) return { ...empty, status: 'none' }
      if (result.data) {
        const exchanges = offerExchanges(offer, result.data)
        return { ...empty, status: 'ready', exchanges, count: exchangeCount(exchanges) }
      }
      return { ...empty, status: result.isError ? 'error' : 'pending' }
    })
  })

  return {
    states,
    pending: computed(() => states.value.some((s) => s.status === 'pending')),
    failed: computed(
      () => !!toValue(options.ownerListFailed) || results.value.some((r) => r.isError)
    ),
    refetch: () =>
      Promise.all([
        ...(toValue(options.ownerListFailed) && options.retryOwnerList
          ? [options.retryOwnerList()]
          : []),
        ...results.value.filter((r) => r.isError).map((r) => r.refetch()),
      ]),
  }
}

/** One offer found for several of mine: «Подходит мне». */
export interface MatchedOffer {
  target: Offer
  kind: 'direct' | 'chain'
  /** My offer it is for. */
  source: Offer
  chain?: ExchangeChain
}

/**
 * Exchanges for all my active offers: the exchanges section, the counters in
 * «Мои объявления» and in the cabinet menu.
 */
export function useMyExchanges() {
  const session = useSessionStore()
  const me = computed(() => session.address)
  const mine = useOffersByAddress(me)
  const account = useAccount(me)

  const active = computed(() =>
    (mine.data.value ?? []).filter((o) => isOfferActive(o)).sort((a, b) => b.time - a.time)
  )
  const list = computed(() => (account.isSuccess.value ? (account.data.value?.tags ?? []) : null))
  const matches = useMatchGroups(active, list, {
    ownerListFailed: () => account.isError.value,
    retryOwnerList: () => account.refetch(),
  })

  /** Each offer once, direct first, with the first of my offers it fits. */
  const unique = computed<MatchedOffer[]>(() => {
    const seen = new Set<string>()
    const direct: MatchedOffer[] = []
    const chains: MatchedOffer[] = []
    for (const s of matches.states.value) {
      for (const target of s.exchanges?.direct ?? [])
        direct.push({ target, kind: 'direct', source: s.offer })
      for (const chain of s.exchanges?.chains ?? [])
        chains.push({ target: chain.target, kind: 'chain', source: s.offer, chain })
    }
    return [...direct, ...chains].filter((m) => {
      const id = m.target.hash ?? ''
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
  })

  /**
   * The cabinet menu's number, the same as the section's list: an offer that
   * fits two of mine is one exchange to look at (audit, finding 76).
   */
  const total = computed(() =>
    matches.states.value.some((s) => s.status === 'ready') ? unique.value.length : null
  )
  const byOffer = computed(
    () => new Map(matches.states.value.map((s) => [s.offer.hash ?? '', s] as const))
  )

  return {
    ...matches,
    offers: mine,
    account,
    active,
    unique,
    total,
    byOffer,
    /** Waiting for my offers or profile, before any group is asked. */
    loadingBase: computed(() => mine.isPending.value || account.isPending.value),
  }
}

/** Exchanges for one offer, with its owner's «my list». */
export function useOfferExchanges(
  offer: MaybeRefOrGetter<Offer | null | undefined>,
  options: { anywhere?: MaybeRefOrGetter<boolean> } = {}
) {
  const account = useAccount(() => toValue(offer)?.address)
  const sources = computed(() => {
    const o = toValue(offer)
    return o ? [o] : []
  })
  const list = computed(() => (account.isSuccess.value ? (account.data.value?.tags ?? []) : null))
  const matches = useMatchGroups(sources, list, {
    ...options,
    ownerListFailed: () => account.isError.value,
    retryOwnerList: () => account.refetch(),
  })
  const state = computed(() => matches.states.value[0] ?? null)
  return { ...matches, state, account, ownerList: list }
}

export interface ExchangePerson {
  name: string
  avatar: string | null
}

/** Bastyon names and avatars of the people in found exchanges: one request for the page. */
export function usePeople(addresses: MaybeRefOrGetter<readonly string[]>) {
  const session = useSessionStore()
  const unique = computed(() => [...new Set(toValue(addresses).filter(Boolean))])
  const profiles = useUserProfiles(unique)
  return computed(() => {
    const map = new Map<string, ExchangePerson>()
    for (const [address, p] of profiles.data.value ?? []) {
      map.set(address, {
        name: p.name,
        avatar: p.image ? (session.sdk?.manageBastyonImageSrc(p.image) ?? p.image) : null,
      })
    }
    return map
  })
}
