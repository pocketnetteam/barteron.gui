import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchAddress, type FoundPlace } from '@/api/geo'
import { useSessionStore } from '@/stores/session'

/**
 * What to say under the field instead of results:
 * - `offline` — outside Bastyon there is no search;
 * - `searching` — waiting for a pause in typing or for the answer;
 * - `failed` — the service did not answer;
 * - `empty` — it answered for this very text, with nothing.
 */
export type AddressSearchNote = 'offline' | 'searching' | 'failed' | 'empty'

/** The note's words. */
export const ADDRESS_NOTE_TEXT: Record<AddressSearchNote, string> = {
  offline: 'create.place.searchOffline',
  searching: 'location.searching',
  failed: 'create.place.searchFailed',
  empty: 'create.place.noResults',
}

/**
 * Address search through Nominatim («Введите адрес»). Nominatim allows one
 * request a second, so the search waits for a pause in typing. The SDK mock
 * stays offline and finds nothing.
 */
export function useAddressSearch() {
  const { locale } = useI18n()
  const session = useSessionStore()
  const query = ref('')
  const results = ref<FoundPlace[]>([])
  const searching = ref(false)
  const failed = ref(false)
  /** The text the last finished search was for. */
  const answered = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null

  watch(query, (text) => {
    clearTimeout(timer)
    controller?.abort()
    results.value = []
    failed.value = false
    answered.value = null
    if (text.trim().length < 3 || session.mode !== 'bastyon') return
    timer = setTimeout(async () => {
      const mine = new AbortController()
      controller = mine
      searching.value = true
      try {
        const found = await searchAddress(text, { locale: locale.value, signal: mine.signal })
        // Typed on meanwhile: this answer is for the old text.
        if (mine.signal.aborted) return
        results.value = found
        answered.value = text
      } catch (error) {
        if (!mine.signal.aborted && (error as Error).name !== 'AbortError') failed.value = true
      } finally {
        if (controller === mine) searching.value = false
      }
    }, 700)
  })

  /** Until the search for this very text has answered, nothing is «не найдено». */
  const note = computed<AddressSearchNote | null>(() => {
    if (query.value.trim().length < 3 || results.value.length) return null
    if (session.mode !== 'bastyon') return 'offline'
    if (failed.value) return 'failed'
    return answered.value === query.value ? 'empty' : 'searching'
  })

  onBeforeUnmount(() => {
    clearTimeout(timer)
    controller?.abort()
  })

  function clear() {
    query.value = ''
    results.value = []
  }

  return { query, results, searching, failed, note, clear }
}
