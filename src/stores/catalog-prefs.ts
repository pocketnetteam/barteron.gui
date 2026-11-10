import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useUserStored } from './stored'

export type ListView = 'tile' | 'row'
export type SortKey = 'height_desc' | 'height_asc' | 'price_asc' | 'price_desc'
export const SORT_KEYS: readonly SortKey[] = [
  'height_desc',
  'height_asc',
  'price_asc',
  'price_desc',
]

/** What the old offer store saved under `<address>_offer`. */
interface StoredPrefs {
  bartersView: ListView
  order: { orderBy: 'height' | 'price'; orderDesc: boolean }
}

const DEFAULT: StoredPrefs = { bartersView: 'tile', order: { orderBy: 'height', orderDesc: true } }

function valid(value: unknown): StoredPrefs {
  if (!value || typeof value !== 'object') return DEFAULT
  const v = value as Partial<StoredPrefs>
  const order = v.order
  return {
    bartersView: v.bartersView === 'row' ? 'row' : 'tile',
    order:
      order && (order.orderBy === 'height' || order.orderBy === 'price')
        ? { orderBy: order.orderBy, orderDesc: !!order.orderDesc }
        : DEFAULT.order,
  }
}

export const sortOf = (order: StoredPrefs['order']): SortKey =>
  `${order.orderBy}_${order.orderDesc ? 'desc' : 'asc'}` as SortKey

export function orderOf(sort: SortKey): StoredPrefs['order'] {
  const [orderBy, dir] = sort.split('_') as ['height' | 'price', string]
  return { orderBy, orderDesc: dir === 'desc' }
}

/** Catalog sort order and tile/list view, kept like the old app kept them. */
export const useCatalogPrefsStore = defineStore('catalog-prefs', () => {
  const stored = useUserStored<StoredPrefs>('offer', DEFAULT, valid)

  return {
    view: computed(() => stored.value.value.bartersView),
    sort: computed(() => sortOf(stored.value.value.order)),
    order: computed(() => stored.value.value.order),
    setView: (view: ListView) => stored.set({ ...stored.value.value, bartersView: view }),
    setSort: (sort: SortKey) => stored.set({ ...stored.value.value, order: orderOf(sort) }),
  }
})
