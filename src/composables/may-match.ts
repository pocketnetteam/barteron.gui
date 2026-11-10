import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useAccount, useBarteron, useCategories, useOffersByAddress } from '@/api/queries'
import type { CategoryTree } from '@/models/categories'
import { exchangeCategories, isOfferActive, type Offer } from '@/models/offer'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'

export interface MatchItem {
  target: Offer
  /** `direct` — they want what I have; `chain` — through a third offer. */
  kind: 'direct' | 'chain'
  /** My offer it fits. */
  source: Offer
  /** Chain: the offers in between. */
  via?: Offer[]
}

/** At most this many of my offer groups are asked about, to spare the node. */
const MAX_GROUPS = 4
const MAX_ITEMS = 12

interface Group {
  myTag: number
  theirTags: number[]
  offers: Offer[]
}

/**
 * My active offers grouped by category and wish list, as the old home page
 * did (`getComplexDeals`): one node request per group, not per offer.
 */
export function matchGroups(mine: readonly Offer[], myList: readonly number[]): Group[] {
  const groups: Group[] = []
  for (const offer of mine) {
    const theirTags = exchangeCategories(offer, myList)
    if (!theirTags.length || offer.tag === null) continue
    const key = [...theirTags].sort((a, b) => a - b).join()
    const same = groups.find(
      (g) => g.myTag === offer.tag && [...g.theirTags].sort((a, b) => a - b).join() === key
    )
    if (same) same.offers.push(offer)
    else groups.push({ myTag: offer.tag, theirTags, offers: [offer] })
  }
  return groups
}

const expand = (tree: CategoryTree, ids: readonly number[]) => [
  ...new Set(ids.flatMap((id) => tree.withDescendants(id))),
]

/** «Может подойти для обмена» on the home page. */
export function useMayMatch() {
  const session = useSessionStore()
  const location = useLocationStore()
  const barteron = useBarteron()
  const client = useQueryClient()
  const categories = useCategories()
  const me = computed(() => session.address)
  const account = useAccount(me)
  const mine = useOffersByAddress(me)

  const active = computed(() => (mine.data.value ?? []).filter((o) => isOfferActive(o)))

  return useQuery({
    queryKey: computed(() => [
      'barteron',
      'feed',
      'may-match',
      me.value,
      location.feedLocation,
      active.value.map((o) => o.txHash),
      account.data.value?.tags ?? null,
    ]),
    enabled: computed(
      () =>
        !!barteron.value &&
        !!me.value &&
        !!categories.tree.value &&
        !!mine.data.value &&
        !!account.data.value &&
        active.value.length > 0
    ),
    queryFn: async (): Promise<MatchItem[]> => {
      const api = barteron.value!.api
      const tree = categories.tree.value!
      const groups = matchGroups(active.value, account.data.value?.tags ?? []).slice(0, MAX_GROUPS)
      const exclude = [me.value!]
      const loc = location.feedLocation
      const results = await Promise.all(
        groups.map(async (g) => {
          const [direct, chains] = await Promise.all([
            api
              .deals({
                // Their offer accepts my category or a parent of it.
                myTags: [g.myTag, ...tree.parents(g.myTag).map((c) => c.id)],
                theirTags: expand(tree, g.theirTags),
                excludeAddresses: exclude,
                location: loc,
                pageSize: 6,
              })
              .catch(() => [] as Offer[]),
            api
              .complexDeals({
                myTag: g.myTag,
                theirTags: g.theirTags,
                excludeAddresses: exclude,
                location: loc,
              })
              .catch(() => []),
          ])
          const source = g.offers[0]!
          return [
            ...direct.slice(0, 3).map((target) => ({ target, kind: 'direct' as const, source })),
            ...chains.slice(0, 2).map((c) => ({
              target: c.target,
              kind: 'chain' as const,
              source,
              via: c.intermediates,
            })),
          ]
        })
      )
      const seen = new Set<string>()
      const items = results
        .flat()
        .filter((i) => isOfferActive(i.target) && i.target.address !== me.value)
        .sort((a, b) => Number(a.kind === 'chain') - Number(b.kind === 'chain'))
        .filter((i) => {
          const id = i.target.hash ?? ''
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
        .slice(0, MAX_ITEMS)
      for (const i of items)
        if (i.target.hash) client.setQueryData(['barteron', 'offer', i.target.hash], i.target)
      return items
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * My active offers that fit what the seller wants: its category is one of
 * theirs or lies under one («Ваш „Ноутбук“ подходит для обмена»).
 */
export function fittingOffers(
  offer: Pick<Offer, 'tags' | 'address'>,
  mine: readonly Offer[],
  tree: CategoryTree,
  sellerList: readonly number[] = []
): Offer[] {
  const wanted = new Set(expand(tree, exchangeCategories(offer, sellerList)))
  return mine.filter(
    (o) => o.address !== offer.address && o.tag !== null && isOfferActive(o) && wanted.has(o.tag)
  )
}

/**
 * «Варианты обмена» on my own offer (s3-itemown): offers that want what I
 * have and have what I want, then chains of three. The old «Найти обмены»
 * page asked `getbarterondeals` the same way (Exchange/content/index.js).
 */
export function useOfferMatches(offer: MaybeRefOrGetter<Offer | null | undefined>) {
  const barteron = useBarteron()
  const client = useQueryClient()
  const categories = useCategories()
  const account = useAccount(() => toValue(offer)?.address)

  return useQuery({
    queryKey: computed(() => [
      'barteron',
      'feed',
      'offer-matches',
      toValue(offer)?.txHash ?? null,
      account.data.value?.tags ?? null,
    ]),
    enabled: computed(() => {
      const o = toValue(offer)
      return (
        !!barteron.value &&
        !!o?.hash &&
        o.tag !== null &&
        !!categories.tree.value &&
        !!account.data.value
      )
    }),
    queryFn: async (): Promise<MatchItem[]> => {
      const source = toValue(offer)!
      const api = barteron.value!.api
      const tree = categories.tree.value!
      const theirTags = exchangeCategories(source, account.data.value?.tags ?? [])
      if (!theirTags.length || source.tag === null) return []
      const exclude = [source.address]
      const [direct, chains] = await Promise.all([
        api
          .deals({
            myTags: [source.tag, ...tree.parents(source.tag).map((c) => c.id)],
            theirTags: expand(tree, theirTags),
            excludeAddresses: exclude,
            pageSize: 24,
          })
          .catch(() => [] as Offer[]),
        api
          .complexDeals({ myTag: source.tag, theirTags, excludeAddresses: exclude })
          .catch(() => []),
      ])
      const seen = new Set<string>()
      const items = [
        ...direct.map((target) => ({ target, kind: 'direct' as const, source })),
        ...chains.map((c) => ({
          target: c.target,
          kind: 'chain' as const,
          source,
          via: c.intermediates,
        })),
      ].filter((i) => {
        const id = i.target.hash ?? ''
        if (!isOfferActive(i.target) || seen.has(id)) return false
        seen.add(id)
        return true
      })
      for (const i of items)
        if (i.target.hash) client.setQueryData(['barteron', 'offer', i.target.hash], i.target)
      return items
    },
    staleTime: 5 * 60_000,
  })
}
