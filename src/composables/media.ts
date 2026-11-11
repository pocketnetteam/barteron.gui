import { onScopeDispose, ref } from 'vue'

/** Phone layout (the same 767 px breakpoint as the styles). */
export const PHONE_QUERY = '(max-width: 767px)'

/** Whether a media query matches now; follows it while the component lives. */
export function useMedia(query: string) {
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : null
  const matches = ref(media?.matches ?? false)
  const update = (event: MediaQueryListEvent) => (matches.value = event.matches)
  media?.addEventListener('change', update)
  onScopeDispose(() => media?.removeEventListener('change', update))
  return matches
}

export const usePhone = () => useMedia(PHONE_QUERY)
