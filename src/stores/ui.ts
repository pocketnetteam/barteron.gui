import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Windows of the app as a whole (s8-dialogs, s8-sheets-mobile, s8-system):
 * one at a time, mounted by `AppDialogs`. On a phone each is a bottom sheet.
 */
export type AppDialog =
  | 'support'
  | 'survey'
  | 'referral'
  | 'legal'
  | 'currency'
  | 'language'
  | 'theme'
  | 'permissions'
  | 'activation'

/** Host permissions the «Нужны разрешения» window can name. */
export type HostPermission = 'account' | 'chat' | 'payment' | 'sign' | 'geolocation'

/** Phone screens that open over the page: search, place, categories. */
export const useUiStore = defineStore('ui', () => {
  const search = ref<{ scope: number | null; text: string } | null>(null)
  const location = ref(false)
  const categories = ref(false)
  /** Desktop «Все категории» menu under the header. */
  const mega = ref(false)
  /** «Как работает безопасная сделка». */
  const safeDealHelp = ref(false)
  const dialog = ref<AppDialog | null>(null)
  /** What «Нужны разрешения» lists. */
  const permissions = ref<HostPermission[]>([])
  /**
   * A piece of the app did not load: a new version replaced the old files
   * (s8-conflict-mobile). Only a restart helps.
   */
  const versionConflict = ref(false)

  return {
    search,
    location,
    categories,
    mega,
    safeDealHelp,
    dialog,
    permissions,
    versionConflict,
    openSafeDealHelp: () => {
      safeDealHelp.value = true
    },
    openDialog: (name: AppDialog) => {
      dialog.value = name
    },
    closeDialog: () => {
      dialog.value = null
    },
    openPermissions: (list: HostPermission[]) => {
      permissions.value = [...new Set(list)]
      dialog.value = 'permissions'
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
