import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories, useOffersByAddress, useRates } from '@/api/queries'
import { formatAgo } from '@/lib/format'
import { isOfferActive } from '@/models/offer'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import type { CardContext } from './card-data'

/**
 * What every card needs to know about the viewer: rates and currency, the
 * categories of their own offers (for «Подходит для обмена»), how to show
 * photos and time. Queries are shared, so many cards make one request each.
 */
export function useCardContext() {
  const { locale } = useI18n()
  const session = useSessionStore()
  const currency = useCurrencyStore()
  const categories = useCategories()
  const rates = useRates()
  const mine = useOffersByAddress(() => session.address)

  const myCategories = computed(
    () =>
      new Set(
        (mine.data.value ?? []).filter((o) => isOfferActive(o)).map((o) => o.tag)
      ) as ReadonlySet<number>
  )

  return computed<Omit<CardContext, 'sellerList' | 'rating' | 'favorite' | 'pending'>>(() => ({
    categoryLabel: (id) => categories.label(id),
    rates: rates.data.value ?? null,
    currency: currency.shown,
    myCategories: myCategories.value,
    viewer: session.address,
    imageSrc: (url) => session.sdk?.manageBastyonImageSrc(url) ?? url,
    formatTime: (ms) => formatAgo(ms, locale.value),
  }))
}
