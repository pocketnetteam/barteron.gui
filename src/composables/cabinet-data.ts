import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAccount, useBalance, useOffersByAddress, useRates, useUserProfile } from '@/api/queries'
import { toEquivalent } from '@/api/rates'
import { formatMoney, formatPkoin } from '@/lib/format'
import { offerLifecycle, type Offer } from '@/models/offer'
import { useCurrencyStore } from '@/stores/currency'
import { useFavoritesStore } from '@/stores/favorites'
import { useSessionStore } from '@/stores/session'
import { useTxStore, type TrackedTx } from '@/stores/tx'
import { useMyExchanges } from './exchanges'
import { useDealList } from './safe-deal'

/** Who I am in the cabinet head: name, avatar, rating, balance. */
export function useCabinetHead() {
  const { t, locale } = useI18n()
  const session = useSessionStore()
  const me = computed(() => session.address)
  const profile = useUserProfile(me)
  const account = useAccount(me)
  const balance = useBalance()
  const rates = useRates()
  const currency = useCurrencyStore()

  const name = computed(() => profile.data.value?.name || t('header.you'))
  const avatar = computed(() => {
    const image = profile.data.value?.image
    return image ? (session.sdk?.manageBastyonImageSrc(image) ?? image) : null
  })
  /** «4,8 · 15 оценок» or «Нет оценок». */
  const rating = computed(() => {
    const a = account.data.value
    if (!a?.ratingCount) return t('profile.noScores')
    const value = a.rating.toLocaleString(locale.value, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    return `${value} · ${t('profile.scores', a.ratingCount)}`
  })
  const pkoin = computed(() =>
    balance.data.value === null || balance.data.value === undefined
      ? null
      : `${formatPkoin(balance.data.value, locale.value)} PKOIN`
  )
  const equivalent = computed(() => {
    const code = currency.shown
    if (!code || balance.data.value === null || balance.data.value === undefined) return null
    const money = toEquivalent(Math.round(balance.data.value * 100), code, rates.data.value)
    return money ? `≈ ${formatMoney(money.amount, money.currency, locale.value)}` : null
  })

  return { me, profile, account, balance, name, avatar, rating, pkoin, equivalent }
}

export interface MyOfferItem {
  offer: Offer
  /** A new offer on its way (or refused): not on the node yet. */
  tx?: TrackedTx
}

/**
 * My offers split the way the cabinet shows them (s5-myoffers): in the
 * network, being published (new ones the node does not have yet), and
 * inactive (withdrawn or expired). Deleted ones are gone.
 */
export function useMyOffers() {
  const session = useSessionStore()
  const tx = useTxStore()
  const query = useOffersByAddress(() => session.address)

  const groups = computed(() => {
    const published = (query.data.value ?? []).filter((o) => o.published !== 'removed')
    const known = new Set(published.map((o) => o.hash))
    const active: MyOfferItem[] = []
    const inactive: MyOfferItem[] = []
    for (const offer of published) {
      const state = offerLifecycle(offer)
      if (state === 'active') active.push({ offer })
      else if (state === 'withdrawn' || state === 'expired') inactive.push({ offer })
    }
    const publishing: MyOfferItem[] = tx.pendingOffers
      .filter((p) => !p.offer.hash || !known.has(p.offer.hash))
      .filter((p) => p.offer.address === session.address)
      .map((p) => ({ offer: p.offer, tx: p.tx }))
    return { active, publishing, inactive }
  })

  /** All but deleted: the count next to «Мои объявления». */
  const total = computed(
    () => groups.value.active.length + groups.value.publishing.length + groups.value.inactive.length
  )

  return { query, groups, total }
}

/** Counts for the cabinet menu: deals — those not finished yet. */
export function useCabinetCounts() {
  const offers = useMyOffers()
  const favorites = useFavoritesStore()
  const exchanges = useMyExchanges()
  const deals = useDealList()
  return computed(() => ({
    ads: offers.query.data.value ? offers.total.value : null,
    barters: exchanges.total.value || null,
    deals: deals.active.value || null,
    favorites: favorites.ids.length || null,
  }))
}
