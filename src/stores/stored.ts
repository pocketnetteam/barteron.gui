import { readonly, ref, watch, type Ref } from 'vue'
import { readStored, userKey, writeStored } from '@/lib/storage'
import { useSessionStore } from './session'

/**
 * A per-user value in localStorage under the old app's key (`<address>_<id>`).
 * It is read again when the address becomes known or changes, like the old
 * stores did after `getPrefix()`. Call inside a Pinia setup store.
 */
export function useUserStored<T>(id: string, fallback: T, valid: (value: unknown) => T) {
  const session = useSessionStore()
  const value = ref(fallback) as Ref<T>

  watch(
    () => session.address,
    (address) => {
      value.value = valid(readStored<unknown>(userKey(id, address), fallback))
    },
    { immediate: true }
  )

  function set(next: T) {
    value.value = next
    writeStored(userKey(id, session.address), next)
  }

  return { value: readonly(value) as Readonly<Ref<T>>, set }
}

/** Offer ids from storage: strings only, without repeats. */
export function idList(value: unknown, max = Infinity): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return [...new Set(ids)].slice(0, max)
}
