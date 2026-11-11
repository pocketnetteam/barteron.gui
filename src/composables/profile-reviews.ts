import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOffersByAddress, useOffersDetails, useUserProfiles } from '@/api/queries'
import { formatDate } from '@/lib/format'
import { useSessionStore } from '@/stores/session'

export interface ProfileReview {
  id: string
  name: string
  seed: string
  avatar: string | null
  /** 1–5; `null` — a review without a score. */
  stars: number | null
  date: string
  time: number
  text: string
  offer: { id: string; title: string }
}

/**
 * Reviews about a seller: those left on any of their offers, active or not,
 * newest first (old profile tab `#votes`). Answers of the author are left out.
 */
export function useProfileReviews(address: MaybeRefOrGetter<string | null | undefined>) {
  const { t, locale } = useI18n()
  const session = useSessionStore()
  const offers = useOffersByAddress(address)
  const ids = computed(() => (offers.data.value ?? []).flatMap((o) => (o.hash ? [o.hash] : [])))
  const details = useOffersDetails(ids)
  const titles = computed(
    () => new Map((offers.data.value ?? []).map((o) => [o.hash ?? '', o.caption]))
  )
  const top = computed(() =>
    (details.data.value?.reviews ?? []).filter((r) => !r.parentId && r.address !== toValue(address))
  )
  const authors = computed(() => [...new Set(top.value.map((r) => r.address))])
  const profiles = useUserProfiles(authors)

  const rows = computed<ProfileReview[]>(() => {
    const known = profiles.data.value
    return [...top.value]
      .sort((a, b) => b.time - a.time)
      .map((r) => {
        const p = known?.get(r.address)
        const n = Number(r.info)
        return {
          id: r.hash,
          name: r.address === session.address ? t('header.you') : p?.name || r.address.slice(0, 8),
          seed: r.address,
          avatar: p?.image ? (session.sdk?.manageBastyonImageSrc(p.image) ?? p.image) : null,
          stars: n >= 1 && n <= 5 ? n : null,
          date: formatDate(r.time, locale.value),
          time: r.time,
          text: r.message,
          offer: { id: r.offerId, title: titles.value.get(r.offerId) ?? '' },
        }
      })
  })

  const loading = computed(
    () => offers.isPending.value || (ids.value.length > 0 && details.isPending.value)
  )
  const error = computed(() => offers.error.value ?? details.error.value)

  return {
    rows,
    loading,
    error,
    refetch: () => {
      void offers.refetch()
      void details.refetch()
    },
  }
}
