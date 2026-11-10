import { defineStore } from 'pinia'
import { computed } from 'vue'
import { idList, useUserStored } from './stored'

/** Favourite offers: ids under the old key `<address>_like`, in the order added. */
export const useFavoritesStore = defineStore('favorites', () => {
  const stored = useUserStored<string[]>('like', [], (v) => idList(v))
  const set = computed(() => new Set(stored.value.value))

  function toggle(id: string) {
    const list = stored.value.value
    stored.set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  /** Drops ids the node no longer knows (old `updateInPatchMode`). */
  function keepOnly(known: readonly string[]) {
    const keep = new Set(known)
    const list = stored.value.value
    if (list.some((id) => !keep.has(id))) stored.set(list.filter((id) => keep.has(id)))
  }

  return {
    ids: stored.value,
    has: (id: string | null | undefined) => !!id && set.value.has(id),
    toggle,
    keepOnly,
  }
})
