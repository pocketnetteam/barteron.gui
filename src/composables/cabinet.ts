import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { removeStored, readStored, storedKeys, userKey } from '@/lib/storage'
import { draftEntries, readDraft, type DraftEntry } from '@/models/draft'
import { isJsonObject } from '@/models/tx'
import { useSessionStore } from '@/stores/session'

/**
 * Sections of my cabinet. They live in the hash of `/profile/<me>`, as the
 * old profile tabs did (`#ads`, `#barters`, `#favorites`, `#votes`), so old
 * links still land on the right place; the rest are new.
 */
export const CABINET_SECTIONS = [
  'ads',
  'barters',
  'deals',
  'favorites',
  'viewed',
  'votes',
  'wallet',
  'notifications',
  'settings',
  'mylist',
  // My profile as others see it.
  'public',
] as const

export type CabinetSection = (typeof CABINET_SECTIONS)[number]

export function sectionFromHash(hash: string | null | undefined): CabinetSection | null {
  const value = (hash ?? '').replace(/^#/, '')
  return (CABINET_SECTIONS as readonly string[]).includes(value) ? (value as CabinetSection) : null
}

export const cabinetRoute = (address: string | null, section?: CabinetSection | null) => ({
  name: 'profile',
  params: { id: address ?? '' },
  hash: section ? `#${section}` : '',
})

/**
 * Drafts kept on this device (stage 5): the new offer's and those of edits.
 * Read on demand: the form writes them in another page.
 */
export function useMyDrafts(address: MaybeRefOrGetter<string | null | undefined>) {
  const session = useSessionStore()
  const version = ref(0)

  const entries = computed<DraftEntry[]>(() => {
    void version.value
    const me = toValue(address)
    if (!me) return []
    const keys = storedKeys(`${me}_offer_draft`)
    return draftEntries(
      me,
      keys.map((key) => [key, readStored<unknown>(key, null)] as const)
    )
  })

  /** Deletes a draft; a video uploaded for it leaves the storage, as «Начать заново» does. */
  async function remove(entry: DraftEntry) {
    removeStored(entry.key)
    version.value++
    if (entry.draft.video && entry.draft.videoUploadedHere) {
      await session.sdk?.videos.remove({ url: entry.draft.video }).catch(() => undefined)
    }
  }

  return { entries, refresh: () => version.value++, remove }
}

/**
 * A refused new offer that went out from the cabinet («Повторить»): the
 * form's draft of it goes too (`draftKey(null, …)` in offer-form), or the form
 * would offer to «continue» an offer already in the network and publish it
 * twice. Only the draft of the same offer: one begun since with another
 * title stays.
 */
export function forgetSentDraft(address: string | null, payload: unknown): void {
  if (!address || !isJsonObject(payload) || typeof payload.caption !== 'string') return
  const key = userKey('offer_draft', address)
  const draft = readDraft(readStored<unknown>(key, null))
  if (draft && draft.caption.trim() === payload.caption.trim()) removeStored(key)
}
