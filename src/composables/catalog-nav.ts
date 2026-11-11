import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useSearchHistoryStore } from '@/stores/search-history'

/**
 * `/category/search` lists all categories: the old app used `search` as the
 * id for a search everywhere, and those links are in chats.
 */
export const ALL_CATEGORIES = 'search'

export function categoryRoute(
  id: number | null,
  query: Record<string, string> = {}
): RouteLocationRaw {
  return {
    name: 'category',
    params: { id: id === null ? ALL_CATEGORIES : String(id) },
    query,
  }
}

/** `{ search }` to keep the search text when moving between categories. */
export function searchQuery(search: string): Record<string, string> {
  return search ? { search } : {}
}

/** Category id from the route param; `null` for «all categories» or junk. */
export function categoryParam(value: unknown): number | null {
  const id = Number(Array.isArray(value) ? value[0] : value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function useCatalogNav() {
  const router = useRouter()
  const history = useSearchHistoryStore()

  function search(query: string, scope: number | null) {
    const text = query.trim()
    if (text) history.add(text)
    void router.push(categoryRoute(scope, text ? { search: text } : {}))
  }

  function category(id: number | null) {
    void router.push(categoryRoute(id))
  }

  return { search, category }
}
