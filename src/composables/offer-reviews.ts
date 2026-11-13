import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferDetails, useUserProfile, useUserProfiles } from '@/api/queries'
import type { ReviewRow } from '@/components/item/ItemReviews.vue'
import { formatDate } from '@/lib/format'
import type { Offer } from '@/models/offer'
import { averageScore, toReviewPayload, toVotePayload } from '@/models/review'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'

/**
 * Scores and reviews of an offer (old `votes`): the list with authors' names,
 * my reviews on their way, and sending. A score is given once and never by
 * the author; anyone signed in may write.
 */
export function useOfferReviews(offer: Ref<Offer>) {
  const { t, locale } = useI18n()
  const session = useSessionStore()
  const tx = useTxStore()
  const id = computed(() => offer.value.hash ?? '')
  const me = computed(() => session.address)

  const details = useOfferDetails(id)
  const average = computed(() => averageScore(details.data.value?.scores ?? []))
  const authors = computed(() => [
    ...new Set((details.data.value?.reviews ?? []).map((r) => r.address)),
  ])
  const profiles = useUserProfiles(authors)
  const myProfile = useUserProfile(me)

  const myTx = computed(() =>
    tx.items.filter((x) => x.target === id.value && (x.kind === 'review' || x.kind === 'vote'))
  )
  const own = computed(() => !!me.value && offer.value.address === me.value)
  const voted = computed(
    () =>
      !!me.value &&
      ((details.data.value?.scores ?? []).some((s) => s.address === me.value) ||
        myTx.value.some((x) => x.kind === 'vote' && x.status !== 'failed'))
  )

  const stars = (info: unknown): number | null => {
    const n = Number(info)
    return n >= 1 && n <= 5 ? n : null
  }

  const rows = computed<ReviewRow[]>(() => {
    const known = profiles.data.value
    const published: ReviewRow[] = (details.data.value?.reviews ?? [])
      .filter((r) => !r.parentId)
      .sort((a, b) => b.time - a.time)
      .map((r) => {
        const p = known?.get(r.address)
        return {
          id: r.hash,
          name: r.address === me.value ? t('header.you') : p?.name || r.address.slice(0, 8),
          seed: r.address,
          avatar: p?.image ? (session.sdk?.manageBastyonImageSrc(p.image) ?? null) : null,
          stars: stars(r.info),
          date: formatDate(r.time, locale.value),
          text: r.message,
        }
      })
    const mine = myTx.value
      .filter((x) => x.kind === 'review' && x.status !== 'done')
      .map((x): ReviewRow => {
        const p = x.payload as { msgparsed?: { message?: string; info?: string } } | null
        return {
          id: x.id,
          name: t('header.you'),
          seed: me.value ?? '',
          stars: stars(p?.msgparsed?.info),
          date: '',
          text: p?.msgparsed?.message ?? '',
          pending: x.status === 'failed' ? 'failed' : 'publishing',
          error: x.error,
        }
      })
    return [...mine, ...published]
  })

  /** `score` — stars and text; `comment` — text only (scored already, or the author). */
  const form = computed<'score' | 'comment'>(() => (own.value || voted.value ? 'comment' : 'score'))
  const sending = computed(() => myTx.value.some((x) => x.status === 'sending'))
  /**
   * Bastyon does not let users under 100 reputation give low scores (old
   * error#60). Only once the reputation is known: signed out or loading is
   * not «too new».
   */
  const lowScoreBlocked = computed(
    () => myProfile.isSuccess.value && (myProfile.data.value?.reputation ?? 0) < 100
  )

  async function submit(value: { stars: number | null; text: string }) {
    if (!(await session.ensureSignedIn())) return
    // After sign-in the offer may turn out mine or scored already: then the
    // stars go nowhere, not even into the review (the old app wrote there
    // only a score it had just sent).
    const score = value.stars && !own.value && !voted.value ? value.stars : null
    if (score) void tx.send('vote', toVotePayload(id.value, offer.value.address, score))
    if (value.text) {
      void tx.send('review', toReviewPayload(id.value, value.text, score ?? undefined))
    }
  }

  return { average, rows, form, sending, lowScoreBlocked, submit, details }
}
