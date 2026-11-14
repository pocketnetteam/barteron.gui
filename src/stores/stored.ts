import { onScopeDispose, readonly, ref, watch, type Ref } from 'vue'
import { onStorageChange, readStored, userKey, writeStored } from '@/lib/storage'
import { useSessionStore } from './session'

/**
 * A per-user value in localStorage under the old app's key (`<address>_<id>`).
 * It is read again when the address becomes known or changes, like the old
 * stores did after `getPrefix()`, and when another tab writes it: otherwise
 * this tab's next write would bring back its stale copy. Call inside a Pinia
 * setup store.
 */
export function useUserStored<T>(id: string, fallback: T, valid: (value: unknown) => T) {
  const session = useSessionStore()
  const value = ref(fallback) as Ref<T>
  const key = () => userKey(id, session.address)
  const read = () => {
    value.value = valid(readStored<unknown>(key(), fallback))
  }

  watch(() => session.address, read, { immediate: true })
  onScopeDispose(onStorageChange(key, read))

  function set(next: T) {
    value.value = next
    writeStored(key(), next)
  }

  return { value: readonly(value) as Readonly<Ref<T>>, set }
}

/** Offer ids from storage: strings only, without repeats. */
export function idList(value: unknown, max = Infinity): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0)
  return [...new Set(ids)].slice(0, max)
}
