import { defineStore } from 'pinia'
import { useUserStored } from './stored'

const MAX = 8

const valid = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((v): v is string => typeof v === 'string' && !!v.trim()))].slice(
        0,
        MAX
      )
    : []

/**
 * Recent searches, on this device only («История поиска хранится только на
 * этом устройстве»). New in this version: key `<address>_search_history`.
 */
export const useSearchHistoryStore = defineStore('search-history', () => {
  const stored = useUserStored<string[]>('search_history', [], valid)

  function add(query: string) {
    const text = query.trim()
    if (!text) return
    const rest = stored.value.value.filter((q) => q.toLowerCase() !== text.toLowerCase())
    stored.set([text, ...rest].slice(0, MAX))
  }

  const remove = (query: string) => stored.set(stored.value.value.filter((q) => q !== query))
  const clear = () => stored.set([])

  return { items: stored.value, add, remove, clear }
})
