import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { searchAddress, type FoundPlace } from '@/api/geo'
import { useSessionStore } from '@/stores/session'

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
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null

  watch(query, (text) => {
    clearTimeout(timer)
    controller?.abort()
    results.value = []
    failed.value = false
    if (text.trim().length < 3 || session.mode !== 'bastyon') return
    timer = setTimeout(async () => {
      controller = new AbortController()
      searching.value = true
      try {
        results.value = await searchAddress(text, {
          locale: locale.value,
          signal: controller.signal,
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') failed.value = true
      } finally {
        searching.value = false
      }
    }, 700)
  })

  onBeforeUnmount(() => {
    clearTimeout(timer)
    controller?.abort()
  })

  function clear() {
    query.value = ''
    results.value = []
  }

  return { query, results, searching, failed, clear }
}
