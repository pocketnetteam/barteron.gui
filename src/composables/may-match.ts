import { computed } from 'vue'
import { useAccount, useOffersByAddress } from '@/api/queries'
import type { CategoryTree } from '@/models/categories'
import type { ExchangeChain } from '@/models/exchange'
import { exchangeCategories, isOfferActive, type Offer } from '@/models/offer'
import { useSessionStore } from '@/stores/session'
import { useMatchGroups } from './exchanges'

export interface MatchItem {
  target: Offer
  /** `direct` — they want what I have; `chain` — through a third offer. */
  kind: 'direct' | 'chain'
  /** My offer it fits. */
  source: Offer
  chain?: ExchangeChain
}

/** At most this many of my offer groups are asked about on the home page, to spare the node. */
const MAX_GROUPS = 4
const MAX_ITEMS = 12

/**
 * «Может подойти для обмена» on the home page: a few exchanges for my first
 * groups of offers, as the old home page did (`getComplexDeals`). The same
 * cache as the exchanges section (`useMatchGroups`).
 */
export function useMayMatch() {
  const session = useSessionStore()
  const me = computed(() => session.address)
  const account = useAccount(me)
  const mine = useOffersByAddress(me)
  const active = computed(() =>
    (mine.data.value ?? []).filter((o) => isOfferActive(o)).sort((a, b) => b.time - a.time)
  )
  const list = computed(() => (account.isSuccess.value ? (account.data.value?.tags ?? []) : null))
  const matches = useMatchGroups(active, list, { maxGroups: MAX_GROUPS })

  const items = computed<MatchItem[]>(() => {
    const seen = new Set<string>()
    const groups = new Set<string>()
    const result: MatchItem[] = []
    for (const s of matches.states.value) {
      if (!s.exchanges) continue
      // Offers of the same group found the same: once is enough.
      const key = `${s.offer.tag}:${s.offer.tags.join()}`
      if (groups.has(key)) continue
      groups.add(key)
      result.push(
        ...s.exchanges.direct
          .slice(0, 3)
          .map((target) => ({ target, kind: 'direct' as const, source: s.offer })),
        ...s.exchanges.chains.slice(0, 2).map((chain) => ({
          target: chain.target,
          kind: 'chain' as const,
          source: s.offer,
          chain,
        }))
      )
    }
    return result
      .sort((a, b) => Number(a.kind === 'chain') - Number(b.kind === 'chain'))
      .filter((i) => {
        const id = i.target.hash ?? ''
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      .slice(0, MAX_ITEMS)
  })

  return { items, pending: matches.pending }
}

const expand = (tree: CategoryTree, ids: readonly number[]) => [
  ...new Set(ids.flatMap((id) => tree.withDescendants(id))),
]

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
