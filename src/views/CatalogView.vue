<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, useCategories } from '@/api/queries'
import CategoryBrowser from '@/components/catalog/CategoryBrowser.vue'
import FiltersPanel from '@/components/catalog/FiltersPanel.vue'
import OfferList from '@/components/catalog/OfferList.vue'
import RatesNotice from '@/components/catalog/RatesNotice.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAreaPhrase } from '@/components/layout/location-label'
import { categoryParam, categoryRoute, searchQuery } from '@/composables/catalog-nav'
import { useCatalogList } from '@/composables/catalog-list'
import { formatRadius } from '@/lib/area'
import {
  catalogRequest,
  filterChips,
  filtersQuery,
  parseFilters,
  resetFilters,
  withoutChip,
  type CatalogFilters,
  type FilterChip,
} from '@/models/filters'
import { SORT_KEYS, useCatalogPrefsStore, type SortKey } from '@/stores/catalog-prefs'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiBreadcrumbs, { type Crumb } from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiChip from '@/ui/UiChip.vue'
import UiEmptyState from '@/ui/UiEmptyState.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiScreen from '@/ui/UiScreen.vue'
import UiSelect from '@/ui/UiSelect.vue'

/**
 * Catalog and search (s2-catalog-desktop/mobile/states): `/category/:id`,
 * `/category/search?search=…` for all categories, as in the old app.
 */
const PAGE_SIZE = 12

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const location = useLocationStore()
const prefs = useCatalogPrefsStore()
const ui = useUiStore()
const categories = useCategories()
const account = useAccount(() => session.address)
const areaPhrase = useAreaPhrase()

const category = computed(() => categoryParam(route.params.id))
const filters = computed(() => parseFilters(route.query))
const tree = computed(() => categories.tree.value)
const current = computed(() => tree.value?.get(category.value) ?? null)
const name = (id: number | null | undefined) => categories.label(id) ?? ''
const myListTags = computed(() => account.data.value?.tags ?? [])

const request = computed(() =>
  tree.value
    ? catalogRequest({
        category: category.value,
        filters: filters.value,
        tree: tree.value,
        location: location.feedLocation,
        order: prefs.order,
        pageSize: PAGE_SIZE,
        myListTags: myListTags.value,
      })
    : null
)
const list = useCatalogList(request, filters, {
  failed: () => categories.error.value,
  retryPrepare: categories.retry,
})

function apply(next: CatalogFilters) {
  void router.replace({ query: filtersQuery(next) })
}

const draft = ref<CatalogFilters>(filters.value)
watch(filters, (f) => (draft.value = f))
const draftChanged = computed(
  () => JSON.stringify(filtersQuery(draft.value)) !== JSON.stringify(filtersQuery(filters.value))
)

/** An exchange category the tree does not know has no name and does nothing: no chip. */
const chips = computed(() =>
  filterChips(filters.value).filter((c) => c.key !== 'exchange' || !!tree.value?.get(c.id))
)
const count = computed(() => chips.value.length)
const num = (n: number) => new Intl.NumberFormat(locale.value).format(n)
function chipLabel(chip: FilterChip): string {
  switch (chip.key) {
    case 'price':
      if (chip.min === null) return t('filters.chip.priceUpTo', { n: num(chip.max!) })
      if (chip.max === null) return t('filters.chip.priceFrom', { n: num(chip.min) })
      return t('filters.chip.price', { min: num(chip.min), max: num(chip.max) })
    case 'free':
      return t('filters.free')
    case 'exchange':
      return t('filters.chip.exchange', { name: name(chip.id) })
    case 'myList':
      return t('filters.myList')
    case 'condition':
      return t(`offer.condition.${chip.value}`)
    case 'delivery':
      return t(`filters.way.${chip.value}`)
    case 'safeDeal':
      return t('filters.safeDeal')
  }
}

const sortOptions = computed(() =>
  SORT_KEYS.map((key) => ({ value: key, label: t(`sort.${key}`) }))
)
const sort = computed({
  get: () => prefs.sort,
  set: (value: SortKey) => prefs.setSort(value),
})

const crumbs = computed<Crumb[]>(() => {
  const items: Crumb[] = [{ label: t('catalog.home'), to: { name: 'home' } }]
  if (!current.value) {
    items.push({ label: filters.value.search ? t('catalog.search') : t('catalog.all') })
    return items
  }
  for (const p of tree.value?.parents(current.value.id) ?? []) {
    items.push({ label: name(p.id), to: categoryRoute(p.id) })
  }
  items.push({ label: name(current.value.id) })
  return items
})

const title = computed(() => {
  if (filters.value.search) return `«${filters.value.search}»`
  return current.value ? name(current.value.id) : t('catalog.all')
})

/** Chips under the title. All categories at once are too many: the filter column lists them. */
const subcategories = computed(() =>
  current.value ? (tree.value?.children(current.value.id) ?? []) : []
)
const keepSearch = computed(() => searchQuery(filters.value.search))

/** Search results by subcategory: «Все · 18», «Велосипеды · 14»… (loaded offers). */
const facets = computed(() => {
  const t2 = tree.value
  if (!t2 || !filters.value.search) return []
  const counts = new Map<number, number>()
  for (const offer of list.offers.value) {
    if (offer.tag === null) continue
    const path = [...t2.parents(offer.tag).map((c) => c.id), offer.tag]
    const at = category.value === null ? -1 : path.indexOf(category.value)
    const facet = category.value === null ? path[0] : at >= 0 ? path[at + 1] : undefined
    if (facet !== undefined) counts.set(facet, (counts.get(facet) ?? 0) + 1)
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, n]) => ({ id, n }))
})
const found = computed(() => {
  const n = list.offers.value.length
  const where = current.value
    ? t('catalog.inCategory', { name: name(current.value.id) })
    : t('catalog.inAll')
  return list.complete.value
    ? t('catalog.found', { n, where }, n)
    : t('catalog.foundFirst', { n, where }, n)
})

const radius = computed(() =>
  location.area
    ? formatRadius(location.area.radiusKm, locale.value, {
        km: t('location.km'),
        m: t('location.m'),
      })
    : ''
)
const mapRoute = computed(() => ({
  name: 'categoryMap',
  params: { id: route.params.id as string },
  query: route.query,
}))
const from = computed(() => (location.filtered ? (location.area?.center ?? null) : null))
const parent = computed(() =>
  current.value?.parent ? (tree.value?.get(current.value.parent) ?? null) : null
)

// Phone screens
const filtersOpen = ref(false)
const pickCategory = ref(false)
function openFilters() {
  draft.value = filters.value
  filtersOpen.value = true
}
function showFiltered() {
  apply(draft.value)
  filtersOpen.value = false
}
function chooseCategory(id: number | null) {
  pickCategory.value = false
  filtersOpen.value = false
  void router.push(categoryRoute(id, filtersQuery(draft.value) as Record<string, string>))
}
function back() {
  if (window.history.state?.back) router.back()
  else void router.push({ name: 'home' })
}
</script>

<template>
  <AppLayout :scope="category" :query="filters.search" tab="search">
    <template #mobile-top>
      <div class="ctop">
        <div class="ctop__row">
          <button type="button" class="ctop__icon" :aria-label="t('ui.back')" @click="back">
            <UiIcon name="back" :size="24" :stroke="2" />
          </button>
          <button
            type="button"
            class="ctop__search"
            data-testid="mobile-search"
            @click="ui.openSearch(category, filters.search)"
          >
            <UiIcon name="search" :size="20" />
            <span>{{
              filters.search ||
              (current
                ? t('search.placeholderIn', { name: name(current.id) })
                : t('header.searchPlaceholder'))
            }}</span>
          </button>
          <button
            type="button"
            class="ctop__icon"
            :aria-label="t('location.title')"
            @click="ui.openLocation()"
          >
            <UiIcon name="location" :size="24" />
          </button>
        </div>
        <div class="ctop__chips">
          <button
            type="button"
            class="ctop__filters"
            data-testid="mobile-filters"
            @click="openFilters"
          >
            <UiIcon name="filters" :size="16" :stroke="2" />
            {{ count ? t('filters.titleCount', { n: count }) : t('filters.title') }}
          </button>
          <UiChip
            v-for="chip in chips"
            :key="chipLabel(chip)"
            :size="36"
            removable
            :remove-label="t('filters.remove', { name: chipLabel(chip) })"
            @remove="apply(withoutChip(filters, chip))"
          >
            {{ chipLabel(chip) }}
          </UiChip>
        </div>
      </div>
    </template>

    <div class="container catalog" data-testid="catalog">
      <UiBreadcrumbs class="catalog__crumbs" :items="crumbs" />
      <h1 class="catalog__title" data-testid="catalog-title">{{ title }}</h1>
      <p
        v-if="filters.search && !list.loading.value && list.offers.value.length"
        class="catalog__found"
      >
        {{ found }}
      </p>
      <button type="button" class="catalog__area" @click="ui.openLocation()">
        <UiIcon name="location" :size="16" :stroke="2" />
        <span>{{ areaPhrase ?? t('location.allRegions') }} ·</span>
        <span class="catalog__change">{{ t('location.change') }}</span>
      </button>

      <nav v-if="facets.length > 1" class="catalog__facets" :aria-label="t('catalog.facets')">
        <span class="catalog__facet catalog__facet--on">{{
          t('catalog.facetAll', { n: list.offers.value.length })
        }}</span>
        <RouterLink
          v-for="f in facets"
          :key="f.id"
          class="catalog__facet"
          :to="categoryRoute(f.id, filtersQuery(filters) as Record<string, string>)"
        >
          {{ name(f.id) }} · {{ f.n }}
        </RouterLink>
      </nav>
      <nav
        v-else-if="subcategories.length"
        class="catalog__subs"
        :aria-label="t('catalog.subcategories')"
      >
        <RouterLink
          v-for="c in subcategories"
          :key="c.id"
          class="catalog__sub"
          :to="categoryRoute(c.id, keepSearch)"
        >
          {{ name(c.id) }}
        </RouterLink>
      </nav>

      <div class="catalog__body">
        <aside class="catalog__aside" :aria-label="t('filters.title')">
          <FiltersPanel
            v-model="draft"
            :category="category"
            :my-list="myListTags.length > 0"
            :map-route="mapRoute"
          />
          <div class="catalog__aside-actions">
            <UiButton
              variant="neutral"
              :disabled="!count && !draftChanged"
              @click="apply(resetFilters(filters))"
            >
              {{ t('filters.reset') }}
            </UiButton>
            <UiButton :disabled="!draftChanged" data-testid="filters-apply" @click="apply(draft)">
              {{ t('filters.show') }}
            </UiButton>
          </div>
        </aside>

        <section class="catalog__main" :aria-label="t('catalog.offers')">
          <div class="catalog__bar">
            <UiChip
              v-for="chip in chips"
              :key="chipLabel(chip)"
              removable
              :remove-label="t('filters.remove', { name: chipLabel(chip) })"
              @remove="apply(withoutChip(filters, chip))"
            >
              {{ chipLabel(chip) }}
            </UiChip>
            <button
              v-if="chips.length"
              type="button"
              class="catalog__reset"
              @click="apply(resetFilters(filters))"
            >
              {{ t('filters.resetAll') }}
            </button>
            <span class="catalog__spacer" />
            <UiSelect
              v-model="sort"
              class="catalog__sort"
              :options="sortOptions"
              :label="t('sort.label')"
              :size="44"
            />
            <div class="catalog__views" role="group" :aria-label="t('catalog.view')">
              <button
                type="button"
                class="catalog__view"
                :class="{ 'catalog__view--on': prefs.view === 'tile' }"
                :aria-pressed="prefs.view === 'tile'"
                :aria-label="t('catalog.tiles')"
                @click="prefs.setView('tile')"
              >
                <UiIcon name="tiles" :size="18" />
              </button>
              <button
                type="button"
                class="catalog__view"
                :class="{ 'catalog__view--on': prefs.view === 'row' }"
                :aria-pressed="prefs.view === 'row'"
                :aria-label="t('catalog.rows')"
                @click="prefs.setView('row')"
              >
                <UiIcon name="rows" :size="18" />
              </button>
              <RouterLink
                class="catalog__view catalog__view--map"
                :to="mapRoute"
                data-testid="to-map"
              >
                <UiIcon name="location" :size="18" /><span>{{ t('catalog.map') }}</span>
              </RouterLink>
            </div>
          </div>

          <div
            v-if="location.filtered && list.offers.value.length"
            class="catalog__geo"
            data-testid="geo-notice"
          >
            <UiIcon name="info" :size="20" />
            <span>
              {{
                t('catalog.geoNotice', {
                  radius,
                  place: location.placeName ?? t('location.chosenPlace'),
                })
              }}
              <RouterLink :to="mapRoute">{{ t('catalog.geoChange') }}</RouterLink>
              {{ t('catalog.geoOr') }}
              <button type="button" class="catalog__link" @click="location.reset(true)">
                {{ t('catalog.geoEverywhere') }}
              </button>
            </span>
          </div>
          <RatesNotice />

          <OfferList
            :offers="list.offers.value"
            :view="prefs.view"
            :loading="list.loading.value"
            :error="list.error.value"
            :more-error="list.moreError.value"
            :has-more="list.hasMore.value"
            :loading-more="list.loadingMore.value"
            :from="from"
            portions-note
            @more="list.more"
            @retry="list.retry"
          >
            <template #empty>
              <div class="catalog__empty" data-testid="catalog-empty">
                <UiEmptyState
                  v-if="filters.search"
                  icon="search-empty"
                  :title="t('catalog.emptySearch', { query: filters.search })"
                  :text="t('catalog.emptySearchText')"
                >
                  <div class="catalog__empty-actions">
                    <UiButton
                      v-if="category !== null"
                      :to="categoryRoute(null, { search: filters.search })"
                    >
                      {{ t('catalog.searchEverywhere') }}
                    </UiButton>
                    <UiButton v-if="count" variant="neutral" @click="apply(resetFilters(filters))">
                      {{ t('filters.resetCount', { n: count }) }}
                    </UiButton>
                  </div>
                </UiEmptyState>
                <UiEmptyState
                  v-else-if="location.filtered"
                  icon="location"
                  :title="
                    current
                      ? t('catalog.emptyGeo', { radius, name: name(current.id) })
                      : t('catalog.emptyGeoAll', { radius })
                  "
                  :text="t('catalog.emptyGeoText')"
                >
                  <div class="catalog__empty-actions">
                    <UiButton :to="mapRoute">{{ t('catalog.geoChangeButton') }}</UiButton>
                    <UiButton variant="neutral" @click="location.reset(true)">
                      {{ t('location.allRegions') }}
                    </UiButton>
                  </div>
                </UiEmptyState>
                <UiEmptyState
                  v-else-if="count"
                  icon="filters"
                  :title="t('catalog.emptyFilters')"
                  :text="t('catalog.emptyFiltersText')"
                >
                  <UiButton variant="neutral" @click="apply(resetFilters(filters))">
                    {{ t('filters.resetCount', { n: count }) }}
                  </UiButton>
                </UiEmptyState>
                <UiEmptyState
                  v-else
                  icon="tiles"
                  :title="t('catalog.empty')"
                  :text="t('catalog.emptyText')"
                >
                  <UiButton v-if="parent" variant="neutral" :to="categoryRoute(parent.id)">
                    {{ t('catalog.viewParent', { name: name(parent.id) }) }}
                  </UiButton>
                </UiEmptyState>
              </div>
            </template>
          </OfferList>
        </section>
      </div>
    </div>

    <UiScreen v-model:open="filtersOpen" :title="t('filters.title')" dismiss="close">
      <template #head-end>
        <button type="button" class="catalog__sheet-reset" @click="draft = resetFilters(draft)">
          {{ t('filters.reset') }}
        </button>
      </template>
      <FiltersPanel
        v-model="draft"
        variant="sheet"
        :category="category"
        :my-list="myListTags.length > 0"
        :map-route="mapRoute"
        @categories="pickCategory = true"
        @location="ui.openLocation()"
      />
      <template #footer>
        <UiButton block :size="52" data-testid="filters-show" @click="showFiltered">
          {{ t('filters.showOffers') }}
        </UiButton>
      </template>
    </UiScreen>

    <UiScreen v-model:open="pickCategory" :title="t('filters.category')">
      <CategoryBrowser mode="pick" :start="current?.parent ?? null" @select="chooseCategory" />
    </UiScreen>
  </AppLayout>
</template>

<style scoped>
.catalog {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.catalog__title {
  margin: 4px 0 0;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  letter-spacing: -0.5px;
  overflow-wrap: anywhere;
}

.catalog__found {
  margin: -6px 0 0;
  font-size: 14px;
  color: var(--text2);
}

.catalog__area {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
}

.catalog__change {
  color: var(--link);
  font-weight: 600;
}

.catalog__subs,
.catalog__facets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog__sub,
.catalog__facet {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  display: flex;
  align-items: center;
  text-decoration: none;
  white-space: nowrap;
}

.catalog__sub:hover,
.catalog__facet:hover {
  text-decoration: none;
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.catalog__facet--on,
.catalog__facet--on:hover {
  background: var(--contrast);
  color: var(--on-contrast);
  font-weight: 600;
  box-shadow: none;
}

.catalog__body {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.catalog__aside {
  border-radius: var(--radius-l);
  background: var(--surface);
  display: flex;
  flex-direction: column;
}

.catalog__aside-actions {
  position: sticky;
  bottom: 0;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  border-radius: 0 0 var(--radius-l) var(--radius-l);
  background: var(--surface);
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
}

.catalog__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.catalog__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.catalog__spacer {
  flex: 1;
}

.catalog__reset {
  height: 34px;
  padding: 0 10px;
  border: 0;
  background: none;
  color: var(--text2);
  font: 500 13px / 18px var(--font-sans);
}

.catalog__reset:hover {
  color: var(--text);
}

.catalog__sort {
  width: 200px;
}

.catalog__views {
  padding: 3px;
  border-radius: var(--radius-m);
  background: var(--surface);
  display: flex;
  gap: 2px;
}

.catalog__view {
  min-width: 36px;
  height: 38px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text2);
  font: 500 13px / 18px var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}

.catalog__view:hover {
  color: var(--text);
  text-decoration: none;
}

.catalog__view--on {
  background: var(--muted);
  color: var(--text);
}

.catalog__geo {
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--info-soft);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  line-height: 20px;
}

.catalog__geo .ui-icon {
  flex: none;
  color: var(--info);
}

.catalog__geo a,
.catalog__link {
  color: var(--link);
  text-decoration: underline;
}

.catalog__link {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
}

.catalog__empty {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
}

.catalog__empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.catalog__sheet-reset {
  margin-left: auto;
  padding: 8px 4px;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 15px / 20px var(--font-sans);
}

.catalog__area:focus-visible,
.catalog__sub:focus-visible,
.catalog__facet:focus-visible,
.catalog__reset:focus-visible,
.catalog__view:focus-visible,
.catalog__link:focus-visible,
.catalog__sheet-reset:focus-visible {
  outline: none;
  border-radius: 8px;
  box-shadow: 0 0 0 3px var(--ring);
}

.ctop {
  padding: 8px 16px 10px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ctop__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctop__icon {
  flex: none;
  width: 40px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ctop__search {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  font: 400 15px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.ctop__search span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ctop__chips {
  margin: 0 -16px;
  padding: 0 16px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.ctop__chips::-webkit-scrollbar {
  display: none;
}

.ctop__chips > * {
  flex: none;
}

.ctop__filters {
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--contrast);
  color: var(--on-contrast);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctop__filters:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ctop__icon:focus-visible,
.ctop__search:focus-visible {
  outline: none;
  border-radius: 10px;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 1099px) {
  .catalog__body {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}

@media (max-width: 767px) {
  .catalog {
    padding-top: 16px;
    padding-bottom: 24px;
  }

  .catalog__crumbs,
  .catalog__aside,
  .catalog__bar > :deep(.ui-chip),
  .catalog__reset,
  .catalog__view--map,
  .catalog__geo {
    display: none;
  }

  .catalog__title {
    font-size: 24px;
    line-height: 30px;
  }

  .catalog__subs,
  .catalog__facets {
    flex-wrap: nowrap;
    margin: 0 -16px;
    padding: 0 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .catalog__subs::-webkit-scrollbar,
  .catalog__facets::-webkit-scrollbar {
    display: none;
  }

  .catalog__body {
    margin-top: 4px;
    display: block;
  }

  .catalog__sort {
    width: 210px;
    flex: 0 1 auto;
  }
}
</style>
