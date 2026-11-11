import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Phone screens that open over the page: search, place, categories. */
export const useUiStore = defineStore('ui', () => {
  const search = ref<{ scope: number | null; text: string } | null>(null)
  const location = ref(false)
  const categories = ref(false)
  /** Desktop «Все категории» menu under the header. */
  const mega = ref(false)
  /** «Как работает безопасная сделка». */
  const safeDealHelp = ref(false)

  return {
    search,
    location,
    categories,
    mega,
    safeDealHelp,
    openSafeDealHelp: () => {
      safeDealHelp.value = true
    },
    openSearch: (scope: number | null = null, text = '') => {
      search.value = { scope, text }
    },
    closeSearch: () => {
      search.value = null
    },
    openLocation: () => {
      location.value = true
    },
    openCategories: () => {
      categories.value = true
    },
  }
})
