import { defineStore } from 'pinia'
import { idList, useUserStored } from './stored'

/** The old app kept the last 20. */
export const VIEWED_MAX = 20

/** «Вы смотрели»: offer ids under the old key `<address>_viewed`, newest first. */
export const useViewedStore = defineStore('viewed', () => {
  const stored = useUserStored<string[]>('viewed', [], (v) => idList(v, VIEWED_MAX))

  function add(id: string) {
    if (!id || id === 'draft') return
    stored.set([id, ...stored.value.value.filter((x) => x !== id)].slice(0, VIEWED_MAX))
  }

  function keepOnly(known: readonly string[]) {
    const keep = new Set(known)
    const list = stored.value.value
    if (list.some((id) => !keep.has(id))) stored.set(list.filter((id) => keep.has(id)))
  }

  return { ids: stored.value, add, keepOnly }
})
