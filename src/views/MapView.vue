<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, useCategories, useRates } from '@/api/queries'
import FiltersPanel from '@/components/catalog/FiltersPanel.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import OffersMap from '@/components/map/OffersMap.vue'
import { useCardContext } from '@/components/offer/card-context'
import { offerCardData } from '@/components/offer/card-data'
import OfferPhoto from '@/components/offer/OfferPhoto.vue'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { FoundPlace } from '@/api/geo'
import { useAddressSearch } from '@/composables/address-search'
import { categoryParam } from '@/composables/catalog-nav'
import { useCatalogList } from '@/composables/catalog-list'
import { DEFAULT_RADIUS, formatDistance, formatRadius, RADIUS_PRESETS, type Area } from '@/lib/area'
import {
  approximateBounds,
  boundsAround,
  decodeGeohash,
  distanceKm,
  type LatLng,
} from '@/lib/geohash'
import {
  activeFilterCount,
  catalogRequest,
  filterChips,
  filtersQuery,
  parseFilters,
  type CatalogFilters,
} from '@/models/filters'
import type { Offer } from '@/models/offer'
import { useCatalogPrefsStore } from '@/stores/catalog-prefs'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSelect from '@/ui/UiSelect.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * The catalog on a map (s2-map-desktop/mobile). The map lists offers of the
 * searched area; after the map is moved, «Искать в этой области» searches
 * there and saves the area as the place filter of every list.
 */
const PAGE_SIZE = 100
/** Below this zoom the area is too big to be a filter (s2-catalog-states, 7). */
const MIN_ZOOM = 7

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const location = useLocationStore()
const prefs = useCatalogPrefsStore()
const categories = useCategories()
const rates = useRates()
const context = useCardContext()
const account = useAccount(() => session.address)

const category = computed(() => categoryParam(route.params.id))
const filters = computed(() => parseFilters(route.query))
const current = computed(() => categories.tree.value?.get(category.value) ?? null)
const listRoute = computed(() => ({
  name: 'category',
  params: { id: route.params.id as string },
  query: route.query,
}))

const searched = ref<Area>(
  location.filtered && location.area
    ? location.area
    : { center: location.mapCenter, radiusKm: DEFAULT_RADIUS }
)
const center = ref<LatLng>(searched.value.center)
const radius = ref(searched.value.radiusKm)
const zoom = ref(12)
const tooBig = computed(() => zoom.value < MIN_ZOOM)
const moved = computed(
  () =>
    radius.value !== searched.value.radiusKm ||
    distanceKm(center.value, searched.value.center) > Math.max(0.3, radius.value * 0.05)
)
const canSearch = computed(() => !tooBig.value && (moved.value || !location.filtered))

const request = computed(() => {
  const tree = categories.tree.value
  if (!tree) return null
  const area = searched.value
  return catalogRequest({
    category: category.value,
    filters: filters.value,
    tree,
    location: approximateBounds(boundsAround(area.center, area.radiusKm * 2)),
    order: prefs.order,
    pageSize: PAGE_SIZE,
    myListTags: account.data.value?.tags ?? [],
  })
})
const list = useCatalogList(request, filters, {
  failed: () => categories.error.value,
  retryPrepare: categories.retry,
})

function searchHere() {
  searched.value = { center: center.value, radiusKm: radius.value }
  location.setArea(searched.value)
}

const units = computed(() => ({ km: t('location.km'), m: t('location.m') }))
const radiusOptions = computed(() =>
  RADIUS_PRESETS.map((km) => ({
    value: km,
    label: t('map.radius', { radius: formatRadius(km, locale.value, units.value) }),
  }))
)

const selected = ref<string | null>(null)
const selectedOffer = computed(
  () => list.offers.value.find((o) => o.hash === selected.value) ?? null
)
watch(list.offers, (offers) => {
  if (selected.value && !offers.some((o) => o.hash === selected.value)) selected.value = null
})

function card(offer: Offer) {
  const data = offerCardData(offer, context.value)
  const at = decodeGeohash(offer.geohash)
  const distance = at
    ? formatDistance(distanceKm(searched.value.center, at), locale.value, units.value)
    : null
  return { ...data, distance }
}
const cards = computed(() => list.offers.value.map((o) => ({ offer: o, data: card(o) })))

const title = computed(() => {
  if (filters.value.search) return t('map.titleSearch', { query: filters.value.search })
  return current.value
    ? t('map.title', { name: categories.label(current.value.id) ?? '' })
    : t('map.titleAll')
})
const count = computed(() => activeFilterCount(filters.value))
const firstChip = computed(() => {
  const chip = filterChips(filters.value)[0]
  if (!chip) return null
  if (chip.key === 'price') {
    const n = (v: number) => new Intl.NumberFormat(locale.value).format(v)
    if (chip.min === null) return t('filters.chip.priceUpTo', { n: n(chip.max!) })
    if (chip.max === null) return t('filters.chip.priceFrom', { n: n(chip.min) })
    return t('filters.chip.price', { min: n(chip.min), max: n(chip.max) })
  }
  return null
})

const mapRef = ref<InstanceType<typeof OffersMap>>()
const address = useAddressSearch()
function goTo(place: FoundPlace) {
  center.value = place.point
  address.clear()
}
async function locate() {
  const point = await location.locate(true)
  if (point) center.value = point
}

const filtersOpen = ref(false)
const draft = ref<CatalogFilters>(filters.value)
function openFilters() {
  draft.value = filters.value
  filtersOpen.value = true
}
function applyFilters() {
  filtersOpen.value = false
  void router.replace({ query: filtersQuery(draft.value) })
}

function back() {
  void router.push(listRoute.value)
}
</script>

<template>
  <div class="mapview" data-testid="map-page">
    <SiteHeader
      class="mapview__header"
      compact
      :scope="category"
      :query="filters.search"
      :list-route="listRoute"
    />

    <div class="mapview__body">
      <aside class="mapview__aside">
        <div class="mapview__aside-head">
          <div class="mapview__title-row">
            <h1 class="mapview__title">{{ title }}</h1>
            <span class="mapview__note">{{ t('map.inArea') }}</span>
          </div>
          <div class="mapview__chips">
            <span v-if="firstChip" class="mapview__chip">{{ firstChip }}</span>
            <button type="button" class="mapview__filters" @click="openFilters">
              <UiIcon name="filters" :size="16" />
              {{ count ? t('filters.titleCount', { n: count }) : t('filters.title') }}
            </button>
          </div>
        </div>
        <div class="mapview__list" data-testid="map-list">
          <template v-if="list.loading.value">
            <div v-for="i in 5" :key="i" class="mapview__item">
              <UiSkeleton width="104px" height="100px" radius="12px" />
              <div class="mapview__item-body">
                <UiSkeleton width="80%" height="14px" />
                <UiSkeleton width="40%" height="18px" />
              </div>
            </div>
          </template>
          <p v-else-if="list.error.value" class="mapview__empty">
            {{ t('list.errorTitle') }}
            <UiButton variant="neutral" :size="36" @click="list.retry">{{
              t('list.retry')
            }}</UiButton>
          </p>
          <p v-else-if="!cards.length" class="mapview__empty">{{ t('map.empty') }}</p>
          <article
            v-for="c in cards"
            :key="c.offer.hash ?? ''"
            class="mapview__item"
            :class="{ 'mapview__item--on': c.offer.hash === selected }"
            @mouseenter="selected = c.offer.hash"
          >
            <OfferPhoto
              class="mapview__photo"
              :src="c.data.photo"
              ratio="104 / 100"
              radius="12px"
            />
            <div class="mapview__item-body">
              <RouterLink class="mapview__item-title" :to="c.data.to ?? ''">{{
                c.data.title
              }}</RouterLink>
              <PriceTag :price="c.data.price" :size="16" no-equivalent />
              <span v-if="c.data.exchange?.length" class="mapview__item-meta">
                {{ t('exchange.label') }} {{ c.data.exchange.map((e) => e.label).join(', ') }}
              </span>
              <span v-if="c.data.distance" class="mapview__item-meta mapview__item-meta--muted">{{
                c.data.distance
              }}</span>
            </div>
          </article>
          <UiButton
            v-if="list.hasMore.value"
            variant="neutral"
            block
            :loading="list.loadingMore.value"
            @click="list.more"
          >
            {{ t('list.more') }}
          </UiButton>
        </div>
      </aside>

      <div class="mapview__map">
        <OffersMap
          ref="mapRef"
          class="mapview__canvas"
          :offers="list.offers.value"
          :center="center"
          :radius-km="radius"
          :selected="selected"
          :rates="rates.data.value"
          @move="(c, z) => ((center = c), (zoom = z))"
          @select="selected = $event"
        >
          <template v-if="selectedOffer" #card>
            <RouterLink
              class="mapview__pop"
              :to="card(selectedOffer).to ?? ''"
              data-testid="map-card"
            >
              <OfferPhoto
                class="mapview__pop-photo"
                :src="card(selectedOffer).photo"
                ratio="1 / 1"
                radius="10px"
              />
              <span class="mapview__pop-body">
                <span class="mapview__pop-title">{{ selectedOffer.caption }}</span>
                <PriceTag :price="card(selectedOffer).price" :size="16" no-equivalent />
                <span
                  v-if="card(selectedOffer).distance"
                  class="mapview__item-meta mapview__item-meta--muted"
                  >{{ card(selectedOffer).distance }}</span
                >
              </span>
            </RouterLink>
          </template>
        </OffersMap>

        <div class="mapview__top">
          <button
            type="button"
            class="mapview__round mapview__mobile"
            :aria-label="t('ui.back')"
            @click="back"
          >
            <UiIcon name="back" :size="22" :stroke="2" />
          </button>
          <div class="mapview__address">
            <label class="mapview__field">
              <UiIcon name="search" :size="18" />
              <span class="visually-hidden">{{ t('location.addressLabel') }}</span>
              <input
                v-model="address.query.value"
                type="search"
                class="mapview__input"
                :placeholder="t('location.addressPlaceholder')"
                autocomplete="off"
              />
            </label>
            <ul v-if="address.results.value.length" class="mapview__results">
              <li v-for="place in address.results.value" :key="place.point.join()">
                <button type="button" class="mapview__result" @click="goTo(place)">
                  {{ place.label }}
                </button>
              </li>
            </ul>
          </div>
          <UiSelect
            v-model="radius"
            class="mapview__radius mapview__desktop"
            :options="radiusOptions"
            :label="t('location.radius')"
          />
          <button
            type="button"
            class="mapview__round mapview__mobile"
            :aria-label="t('filters.title')"
            @click="openFilters"
          >
            <UiIcon name="filters" :size="22" />
          </button>
        </div>

        <button
          v-if="canSearch"
          type="button"
          class="mapview__here"
          data-testid="search-here"
          @click="searchHere"
        >
          <UiIcon name="search-area" :size="18" :stroke="2" />
          <span class="mapview__desktop">{{ t('map.searchHere') }}</span>
          <span class="mapview__mobile">{{ t('map.searchHereShort') }}</span>
        </button>

        <div class="mapview__controls">
          <button
            type="button"
            class="mapview__ctl mapview__desktop"
            :aria-label="t('map.zoomIn')"
            @click="mapRef?.zoomIn()"
          >
            <UiIcon name="plus" :size="20" :stroke="2" />
          </button>
          <button
            type="button"
            class="mapview__ctl mapview__desktop"
            :aria-label="t('map.zoomOut')"
            @click="mapRef?.zoomOut()"
          >
            <UiIcon name="minus" :size="20" :stroke="2" />
          </button>
          <button
            type="button"
            class="mapview__ctl mapview__ctl--locate"
            :aria-label="t('location.locate')"
            @click="locate"
          >
            <UiIcon name="send" :size="20" />
          </button>
        </div>

        <div v-if="tooBig" class="mapview__warn" role="status">
          <UiIcon name="warning" :size="20" />
          <span>
            <strong>{{ t('map.zoomInTitle') }}</strong>
            {{ t('map.zoomInText') }}
          </span>
        </div>
        <div v-else class="mapview__hint mapview__desktop">
          <UiIcon name="info" :size="18" />{{ t('map.saveHint') }}
        </div>

        <div class="mapview__sheet mapview__mobile">
          <span class="mapview__grabber" aria-hidden="true" />
          <div class="mapview__sheet-head">
            <h2 class="mapview__sheet-title">{{ t('map.inThisArea') }}</h2>
            <RouterLink class="mapview__sheet-link" :to="listRoute">{{ t('map.list') }}</RouterLink>
          </div>
          <div class="mapview__strip" data-testid="map-strip">
            <template v-if="list.loading.value">
              <UiSkeleton
                v-for="i in 3"
                :key="i"
                class="mapview__mini"
                width="150px"
                height="172px"
                radius="14px"
              />
            </template>
            <p v-else-if="list.error.value" class="mapview__empty mapview__empty--wide">
              {{ t('list.errorTitle') }}
              <UiButton variant="neutral" :size="36" @click="list.retry">{{
                t('list.retry')
              }}</UiButton>
            </p>
            <p v-else-if="!cards.length" class="mapview__empty mapview__empty--wide">
              {{ t('map.empty') }}
            </p>
            <RouterLink
              v-for="c in cards"
              :key="c.offer.hash ?? ''"
              class="mapview__mini"
              :class="{ 'mapview__mini--on': c.offer.hash === selected }"
              :to="c.data.to ?? ''"
            >
              <OfferPhoto :src="c.data.photo" ratio="150 / 112" radius="10px" />
              <PriceTag :price="c.data.price" :size="16" no-equivalent />
              <span class="mapview__mini-title">{{ c.data.title }}</span>
              <span v-if="c.data.distance" class="mapview__item-meta mapview__item-meta--muted">{{
                c.data.distance
              }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <UiDialog
      v-model:open="filtersOpen"
      class="mapview__desktop-dialog"
      :title="t('filters.title')"
      :width="420"
    >
      <FiltersPanel
        v-model="draft"
        class="mapview__panel"
        :category="category"
        :my-list="(account.data.value?.tags.length ?? 0) > 0"
        :map-route="route"
      />
      <template #actions>
        <UiButton variant="neutral" @click="filtersOpen = false">{{ t('ui.close') }}</UiButton>
        <UiButton @click="applyFilters">{{ t('filters.show') }}</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<style scoped>
.mapview {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--page);
}

.mapview__body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
}

.mapview__aside {
  min-height: 0;
  border-right: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
}

.mapview__aside-head {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapview__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mapview__title {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.mapview__note {
  flex: none;
  max-width: 90px;
  padding-top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}

.mapview__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mapview__chip {
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  background: var(--primary-soft);
  color: var(--link);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.mapview__filters {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text);
  font: 500 13px / 18px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
}

.mapview__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapview__item {
  position: relative;
  padding: 10px 8px;
  border-radius: var(--radius-m);
  display: flex;
  gap: 12px;
}

.mapview__item--on {
  background: var(--primary-soft);
}

.mapview__photo {
  flex: none;
  width: 104px;
}

.mapview__item-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapview__item-title {
  font-size: 14px;
  line-height: 19px;
  color: var(--link);
  text-decoration: none;
}

.mapview__item-title::after {
  content: '';
  position: absolute;
  inset: 0;
}

.mapview__item-meta {
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mapview__item-meta--muted {
  color: var(--text3);
}

.mapview__empty {
  margin: 0;
  padding: 24px 12px;
  color: var(--text2);
  font-size: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.mapview__map {
  position: relative;
  min-height: 0;
}

.mapview__canvas {
  position: absolute;
  inset: 0;
}

.mapview__top {
  position: absolute;
  z-index: 800;
  left: 16px;
  right: max(16px, var(--host-corner, 0px));
  top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
}

.mapview__top > * {
  pointer-events: auto;
}

.mapview__address {
  width: 280px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mapview__field {
  height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  background: var(--surface);
  color: var(--text3);
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapview__field:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.mapview__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.mapview__results {
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--radius-m);
  background: var(--surface);
  box-shadow: var(--shadow-2);
}

.mapview__result {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  font: 400 14px / 20px var(--font-sans);
  text-align: left;
}

.mapview__result:hover {
  background: var(--muted);
}

.mapview__radius {
  width: 170px;
  box-shadow: var(--shadow-2);
  border-radius: var(--radius-m);
}

.mapview__here {
  position: absolute;
  z-index: 800;
  left: 50%;
  top: 76px;
  transform: translateX(-50%);
  height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--contrast);
  color: var(--on-contrast);
  font: 600 14px / 20px var(--font-sans);
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.mapview__controls {
  position: absolute;
  z-index: 800;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mapview__ctl {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mapview__ctl:first-child {
  border-radius: var(--radius-m) var(--radius-m) 0 0;
}

.mapview__ctl:nth-child(2) {
  border-radius: 0 0 var(--radius-m) var(--radius-m);
}

.mapview__ctl--locate {
  margin-top: 12px;
  border-radius: var(--radius-m);
  color: var(--link);
}

.mapview__hint,
.mapview__warn {
  position: absolute;
  z-index: 800;
  left: 16px;
  bottom: 16px;
  max-width: 440px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.mapview__hint .ui-icon {
  flex: none;
  color: var(--info);
}

.mapview__warn {
  align-items: flex-start;
}

.mapview__warn .ui-icon {
  flex: none;
  color: var(--warning);
}

.mapview__warn strong {
  display: block;
  margin-bottom: 4px;
  color: var(--text);
  font-size: 14px;
}

.mapview__pop {
  width: 260px;
  padding: 10px;
  border-radius: var(--radius-m);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-3);
  display: flex;
  gap: 10px;
  text-decoration: none;
}

.mapview__pop:hover {
  text-decoration: none;
}

.mapview__pop-photo {
  flex: none;
  width: 72px;
}

.mapview__pop-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapview__pop-title {
  font-size: 13px;
  line-height: 17px;
  color: var(--link);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mapview__panel {
  margin: 0 -24px;
}

.mapview__mobile {
  display: none !important;
}

.mapview__round,
.mapview__ctl,
.mapview__here,
.mapview__filters,
.mapview__result {
  cursor: pointer;
}

.mapview__round:focus-visible,
.mapview__ctl:focus-visible,
.mapview__here:focus-visible,
.mapview__filters:focus-visible,
.mapview__item-title:focus-visible,
.mapview__pop:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 767px) {
  .mapview__header,
  .mapview__aside,
  .mapview__desktop {
    display: none !important;
  }

  .mapview__mobile {
    display: flex !important;
  }

  .mapview__body {
    display: block;
    position: relative;
  }

  .mapview__map {
    position: absolute;
    inset: 0;
  }

  .mapview__top {
    left: 8px;
    right: max(8px, var(--host-corner, 0px));
    top: 8px;
  }

  .mapview__address {
    flex: 1;
    width: auto;
  }

  .mapview__round {
    flex: none;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-m);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-2);
    align-items: center;
    justify-content: center;
  }

  .mapview__here {
    top: 66px;
    height: 40px;
    padding: 0 16px;
  }

  .mapview__controls {
    top: auto;
    bottom: 290px;
    transform: none;
  }

  .mapview__warn {
    left: 8px;
    right: 8px;
    bottom: 280px;
  }

  .mapview__sheet {
    position: absolute;
    z-index: 800;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 10px 0 calc(16px + env(safe-area-inset-bottom, 0px));
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    background: var(--surface);
    box-shadow: var(--shadow-3);
    flex-direction: column;
    gap: 10px;
  }

  .mapview__grabber {
    align-self: center;
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--border-strong);
  }

  .mapview__sheet-head {
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mapview__sheet-title {
    margin: 0;
    font-size: 17px;
    line-height: 24px;
    font-weight: 700;
  }

  .mapview__sheet-link {
    font-size: 14px;
    font-weight: 600;
    color: var(--link);
  }

  .mapview__strip {
    padding: 0 16px;
    display: flex;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
    min-height: 190px;
  }

  .mapview__strip::-webkit-scrollbar {
    display: none;
  }

  .mapview__empty--wide {
    flex: 1;
  }

  .mapview__mini {
    flex: none;
    width: 150px;
    padding: 6px;
    border-radius: 14px;
    color: var(--text);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mapview__mini--on {
    box-shadow: inset 0 0 0 2px var(--primary);
  }

  .mapview__mini-title {
    font-size: 13px;
    line-height: 17px;
    color: var(--link);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
