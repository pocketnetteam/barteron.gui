<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useCategories } from '@/api/queries'
// Not lazy: it is needed exactly when the network is gone and a piece would not load.
import NetBanner from '@/components/system/NetBanner.vue'
import { useCatalogNav } from '@/composables/catalog-nav'
import { useNetStore } from '@/stores/net'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiScreen from '@/ui/UiScreen.vue'
import AppFooter from './AppFooter.vue'
import AppShell from './AppShell.vue'
import SearchSuggestions from './SearchSuggestions.vue'
import SiteHeader from './SiteHeader.vue'
import TabBar, { type TabItem, type TabKey } from './TabBar.vue'
import { useLocationLabel } from './location-label'

const CategoryBrowser = defineAsyncComponent(
  () => import('@/components/catalog/CategoryBrowser.vue')
)
const LocationPanel = defineAsyncComponent(() => import('./LocationPanel.vue'))
const SafeDealHelp = defineAsyncComponent(() => import('@/components/deal/SafeDealHelp.vue'))

/**
 * Page frame of the app: the desktop header and footer, the phone tab bar,
 * and the phone screens that open over any page (search, categories, place).
 * Pages bring their own phone top bar (`mobile-top`).
 */
defineProps<{
  /** Category the header search runs in. */
  scope?: number | null
  query?: string
  /** Tab to highlight on the phone. */
  tab?: TabKey
}>()

const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const ui = useUiStore()
const net = useNetStore()
const nav = useCatalogNav()
const categories = useCategories()
const locationLabel = useLocationLabel()

const me = computed(() => session.address)
const tabs = computed<TabItem[]>(() => [
  { key: 'search', to: { name: 'home' } },
  {
    key: 'favorites',
    to: me.value ? { name: 'profile', params: { id: me.value }, hash: '#favorites' } : undefined,
  },
  { key: 'create', to: { name: 'createBarter' } },
  {
    key: 'exchanges',
    to: me.value ? { name: 'profile', params: { id: me.value }, hash: '#barters' } : undefined,
  },
  { key: 'profile', to: me.value ? { name: 'profile', params: { id: me.value } } : undefined },
])

function onTab(key: TabKey) {
  if (tabs.value.find((x) => x.key === key)?.to) return
  // Favourites, exchanges and the profile are the user's own: ask to sign in first.
  void session.ensureSignedIn()
}

// Phone search
const searchOpen = computed({
  get: () => !!ui.search,
  set: (value) => {
    if (!value) ui.closeSearch()
  },
})
const searchText = ref('')
const searchScope = ref<number | null>(null)
watch(
  () => ui.search,
  (value) => {
    if (!value) return
    searchText.value = value.text
    searchScope.value = value.scope
  }
)
function runSearch(text: string, where: number | null) {
  ui.closeSearch()
  nav.search(text, where)
}

function pickCategory(id: number | null) {
  ui.categories = false
  nav.category(id)
}

watch(
  () => route.fullPath,
  () => {
    ui.closeSearch()
    ui.categories = false
    ui.location = false
  }
)
</script>

<template>
  <AppShell>
    <template #header>
      <!-- «О проекте» and «Полезные советы» bring a short header of their own. -->
      <slot name="header"><SiteHeader :scope="scope" :query="query" /></slot>
    </template>
    <template v-if="$slots['mobile-top']" #mobile-top>
      <slot name="mobile-top" />
    </template>

    <NetBanner v-if="net.offline" :device="net.deviceOffline" />
    <slot />
    <AppFooter class="layout__footer" />

    <template #tabbar>
      <!-- A page may put its own actions there instead (offer page: chat, exchange, buy). -->
      <slot v-if="$slots['phone-bar']" name="phone-bar" />
      <TabBar v-else :items="tabs" :active="tab" @select="onTab" />
    </template>
  </AppShell>

  <UiScreen v-model:open="searchOpen" class="layout__search">
    <template #head>
      <form class="msearch" role="search" @submit.prevent="runSearch(searchText, searchScope)">
        <label class="msearch__field">
          <span class="visually-hidden">{{ t('header.searchPlaceholder') }}</span>
          <input
            v-model="searchText"
            class="msearch__input"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            autofocus
            :placeholder="
              searchScope
                ? t('search.placeholderIn', { name: categories.label(searchScope) ?? '' })
                : t('header.searchPlaceholder')
            "
          />
          <button
            v-if="searchText"
            type="button"
            class="msearch__clear"
            :aria-label="t('search.clearField')"
            @click="searchText = ''"
          >
            <UiIcon name="close" :size="14" :stroke="2.4" />
          </button>
        </label>
      </form>
    </template>
    <div class="msearch__chips">
      <button
        type="button"
        class="msearch__chip msearch__chip--scope"
        @click="searchScope = searchScope === null ? (ui.search?.scope ?? null) : null"
      >
        {{
          searchScope === null
            ? t('search.allCategories')
            : t('search.inCategoryChip', { name: categories.label(searchScope) ?? '' })
        }}
      </button>
      <button type="button" class="msearch__chip" @click="ui.openLocation()">
        {{ locationLabel }}
      </button>
    </div>
    <SearchSuggestions
      :query="searchText"
      :scope="searchScope"
      @search="runSearch"
      @category="pickCategory"
    />
  </UiScreen>

  <UiScreen v-model:open="ui.categories" :title="t('categoriesScreen.title')">
    <CategoryBrowser @select="pickCategory" />
  </UiScreen>

  <UiDialog v-model:open="ui.location" :title="t('location.title')" :width="440">
    <LocationPanel class="layout__location" :titled="false" @done="ui.location = false" />
  </UiDialog>

  <SafeDealHelp v-if="ui.safeDealHelp" v-model:open="ui.safeDealHelp" />
</template>

<style scoped>
@media (max-width: 767px) {
  .layout__footer {
    display: none;
  }
}

.layout__location {
  padding: 0;
}

.msearch {
  flex: 1;
  min-width: 0;
}

.msearch__field {
  height: 44px;
  padding: 0 6px 0 12px;
  border: 2px solid var(--primary);
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  gap: 8px;
}

.msearch__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 16px / 20px var(--font-sans);
  outline: none;
}

.msearch__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.msearch__clear {
  flex: none;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.msearch__chips {
  padding: 0 16px 8px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.msearch__chip {
  flex: none;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text);
  font: 500 13px / 18px var(--font-sans);
}

.msearch__chip--scope {
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
}

.msearch__chip:focus-visible,
.msearch__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
