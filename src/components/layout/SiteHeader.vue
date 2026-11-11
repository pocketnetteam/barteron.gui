<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useBalance, useCategories, useUserProfile } from '@/api/queries'
import { currenciesFor, CURRENCIES } from '@/api/rates'
import { useCatalogNav } from '@/composables/catalog-nav'
import { LOCALE_CHOICES, useLocaleStore, type LocaleChoice } from '@/stores/locale'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import UiPopover from '@/ui/UiPopover.vue'
import AppHeader from './AppHeader.vue'
import MenuList, { type MenuItem } from './MenuList.vue'
import SearchSuggestions from './SearchSuggestions.vue'
import { useLocationLabel } from './location-label'

// Panels load when first opened: the first screen does not wait for them.
const CategoriesMenu = defineAsyncComponent(() => import('./CategoriesMenu.vue'))
const LocationPanel = defineAsyncComponent(() => import('./LocationPanel.vue'))
const ProfileMenu = defineAsyncComponent(() => import('./ProfileMenu.vue'))

/**
 * The desktop header wired to the stores: place, currency, language and theme
 * in the top strip, categories, search with hints, profile.
 */
const props = defineProps<{
  /** Search runs in this category by default («В категории»). */
  scope?: number | null
  /** Text of the current search. */
  query?: string
  compact?: boolean
  /** Shows «Списком» and goes there. */
  listRoute?: RouteLocationRaw
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const currency = useCurrencyStore()
const localeStore = useLocaleStore()
const theme = useThemeStore()
const categories = useCategories()
const balance = useBalance()
const me = computed(() => session.address)
const profile = useUserProfile(me)
const nav = useCatalogNav()
const locationLabel = useLocationLabel()

type Panel = 'location' | 'currency' | 'language' | 'theme' | 'account' | 'search'
const panel = ref<Panel | null>(null)
const anchor = ref<HTMLElement | null>(null)
const ui = useUiStore()
const megaOpen = computed({
  get: () => ui.mega,
  set: (value: boolean) => (ui.mega = value),
})

function toggle(name: Panel, el: HTMLElement) {
  if (panel.value === name && anchor.value === el) {
    panel.value = null
    return
  }
  anchor.value = el
  panel.value = name
}

const open = (name: Panel) =>
  computed({
    get: () => panel.value === name,
    set: (value: boolean) => {
      if (!value && panel.value === name) panel.value = null
    },
  })
const locationOpen = open('location')
const currencyOpen = open('currency')
const languageOpen = open('language')
const themeOpen = open('theme')
const accountOpen = open('account')
const searchOpen = open('search')

watch(
  () => route.fullPath,
  () => {
    panel.value = null
    megaOpen.value = false
  }
)

const query = ref(props.query ?? '')
watch(
  () => props.query,
  (value) => (query.value = value ?? '')
)

/** «В категории» / «Везде»: where the next search runs. */
const searchInScope = ref(true)
const scope = computed(() => (searchInScope.value ? (props.scope ?? null) : null))
const scopeLabel = computed(() =>
  props.scope
    ? searchInScope.value
      ? t('search.inThisCategory')
      : t('search.everywhere')
    : undefined
)
const placeholder = computed(() =>
  scope.value
    ? t('search.placeholderIn', { name: categories.label(scope.value) ?? '' })
    : t('header.searchPlaceholder')
)

function search(text: string, where: number | null = scope.value) {
  panel.value = null
  nav.search(text, where)
}

const currencyLabel = computed(() => {
  if (currency.pkoinOnly) return t('currency.pkoinOnly')
  const c = CURRENCIES.find((x) => x.code === currency.code)
  return c ? `${c.symbol} ${c.code}` : currency.code
})
const currencyItems = computed<MenuItem[]>(() => [
  ...currenciesFor(localeStore.effective).map((c) => ({
    key: c.code,
    label: `${c.symbol} ${c.code}`,
    checked: !currency.pkoinOnly && c.code === currency.code,
  })),
  {
    key: 'PKOIN',
    label: t('currency.pkoinOnly'),
    checked: currency.pkoinOnly,
    divider: true,
  },
])
function pickCurrency(code: string) {
  if (code === 'PKOIN') currency.setPkoinOnly()
  else currency.set(code)
  panel.value = null
}

const languageItems = computed<MenuItem[]>(() =>
  LOCALE_CHOICES.map((choice) => ({
    key: choice,
    label: t(`language.${choice}`),
    checked: localeStore.choice === choice,
  }))
)
function pickLanguage(choice: string) {
  localeStore.set(choice as LocaleChoice)
  panel.value = null
}

const themeItems = computed<MenuItem[]>(() =>
  (['system', 'light', 'dark'] as const).map((value) => ({
    key: value,
    label: t(`theme.option.${value}`),
    checked: theme.preference === value,
  }))
)
function pickTheme(value: string) {
  theme.setPreference(value as ThemePreference)
  panel.value = null
}

const user = computed(() =>
  session.account === 'signed-in'
    ? {
        name: profile.data.value?.name || t('header.you'),
        seed: me.value ?? undefined,
        avatar: profile.data.value?.image
          ? (session.sdk?.manageBastyonImageSrc(profile.data.value.image) ?? null)
          : null,
        balance: balance.data.value ?? null,
      }
    : undefined
)

function signIn() {
  if (session.account === 'no-permission') void session.requestAccountAccess()
  else void session.signIn()
}

function create() {
  void router.push({ name: 'createBarter' })
}

function favorites() {
  if (me.value) void router.push({ name: 'profile', params: { id: me.value }, hash: '#favorites' })
  else signIn()
}

function tips() {
  void router.push({ name: 'tips' })
}
</script>

<template>
  <div class="site-header">
    <AppHeader
      v-model:query="query"
      class="site-header__bar"
      :location="locationLabel"
      :currency="currencyLabel"
      :language="
        t(
          `language.${localeStore.choice === 'inherit' ? localeStore.effective : localeStore.choice}`
        )
      "
      :theme-name="t(`theme.${theme.preference}`)"
      :user="user"
      :sign-in="session.account === 'signed-in' ? undefined : t('header.signIn')"
      :categories-open="megaOpen"
      :search-scope="scopeLabel"
      :search-placeholder="placeholder"
      :compact="compact"
      :list-label="listRoute ? t('map.list') : undefined"
      @list="listRoute && router.push(listRoute)"
      @location="toggle('location', $event)"
      @currency="toggle('currency', $event)"
      @language="toggle('language', $event)"
      @theme="toggle('theme', $event)"
      @account="toggle('account', $event)"
      @tips="tips"
      @safe-deal="ui.openSafeDealHelp()"
      @referral="ui.openDialog('referral')"
      @support="ui.openDialog('support')"
      @categories="megaOpen = !megaOpen"
      @search="search($event)"
      @search-focus="(el) => ((anchor = el), (panel = 'search'))"
      @search-keydown="(e) => e.key === 'Escape' && (panel = null)"
      @search-scope="searchInScope = !searchInScope"
      @favorites="favorites"
      @sign-in="signIn"
      @create="create"
    />

    <div v-if="megaOpen" class="site-header__mega container">
      <CategoriesMenu @close="megaOpen = false" />
    </div>
    <div v-if="megaOpen" class="site-header__shade" aria-hidden="true" @click="megaOpen = false" />

    <UiPopover
      v-model:open="locationOpen"
      :anchor="anchor"
      :width="380"
      :label="t('location.title')"
    >
      <LocationPanel map-link @done="locationOpen = false" />
    </UiPopover>
    <UiPopover
      v-model:open="currencyOpen"
      :anchor="anchor"
      align="end"
      :width="240"
      :label="t('currency.title')"
    >
      <MenuList :items="currencyItems" :hint="t('currency.hint')" @select="pickCurrency" />
    </UiPopover>
    <UiPopover
      v-model:open="languageOpen"
      :anchor="anchor"
      align="end"
      :width="220"
      :label="t('language.title')"
    >
      <MenuList :items="languageItems" @select="pickLanguage" />
    </UiPopover>
    <UiPopover
      v-model:open="themeOpen"
      :anchor="anchor"
      align="end"
      :width="200"
      :label="t('theme.title')"
    >
      <MenuList :items="themeItems" @select="pickTheme" />
    </UiPopover>
    <UiPopover
      v-model:open="accountOpen"
      :anchor="anchor"
      align="end"
      :width="300"
      :label="t('header.account')"
    >
      <ProfileMenu @close="accountOpen = false" />
    </UiPopover>
    <UiPopover
      v-model:open="searchOpen"
      :anchor="anchor"
      align="stretch"
      keep-focus
      :label="t('search.hints')"
    >
      <SearchSuggestions
        :query="query"
        :scope="scope"
        @search="(text, where) => search(text, where)"
        @category="(id) => ((panel = null), nav.category(id))"
      />
    </UiPopover>
  </div>
</template>

<style scoped>
.site-header {
  position: relative;
  z-index: var(--z-header);
}

.site-header__bar {
  position: relative;
  z-index: 3;
}

.site-header__mega {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  top: 100%;
}

/* Dims the page under the open categories menu; a click closes it. */
.site-header__shade {
  position: fixed;
  z-index: 1;
  inset: 0;
  background: var(--overlay);
}
</style>
