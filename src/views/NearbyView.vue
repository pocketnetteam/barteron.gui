<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import OfferList from '@/components/catalog/OfferList.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAreaPhrase } from '@/components/layout/location-label'
import PageTopBar from '@/components/layout/PageTopBar.vue'
import NearbyCategories from '@/components/nearby/NearbyCategories.vue'
import NearbyDistrict from '@/components/nearby/NearbyDistrict.vue'
import NearbyMap from '@/components/nearby/NearbyMap.vue'
import NearbyPlaceRow from '@/components/nearby/NearbyPlaceRow.vue'
import NearbySellers from '@/components/nearby/NearbySellers.vue'
import SystemState from '@/components/system/SystemState.vue'
import { categoryRoute } from '@/composables/catalog-nav'
import { useNearby, useNearestPlaces } from '@/composables/nearby'
import { useDistrictName } from '@/composables/place-name'
import { DEFAULT_RADIUS, formatDistance, formatRadius, RADIUS_PRESETS } from '@/lib/area'
import type { NearbyPlace } from '@/models/nearby'
import { useLocationStore } from '@/stores/location'
import { useUiStore } from '@/stores/ui'
import UiBreadcrumbs from '@/ui/UiBreadcrumbs.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * «Что продают рядом» (stage 10, no mockup): what is sold around the search
 * area — categories, districts on a map, the sellers with the most offers,
 * the newest offers. A district on the map or in the list narrows it all
 * down to that district. Data: models/nearby.ts.
 */
const SELLERS = 4
const FRESH = 10
const PHONE_DISTRICTS = 4
/** Districts named from OpenStreetMap; the rest say where they are from the centre. */
const NAMED_DISTRICTS = 6

const { t, locale } = useI18n()
const ui = useUiStore()
const location = useLocationStore()
const areaPhrase = useAreaPhrase()

const selected = ref<string | null>(null)
const nearby = useNearby(selected)
const area = nearby.area
watch(area, () => (selected.value = null))

const summary = nearby.summary
const scoped = nearby.scoped
const district = computed(
  () => summary.value?.districts.find((d) => d.cell === selected.value) ?? null
)
const empty = computed(() => !!summary.value && !summary.value.offers.length)
const nearest = useNearestPlaces(() => (empty.value ? area.value : null))

const units = computed(() => ({ km: t('location.km'), m: t('location.m') }))
const where = (d: { distanceKm: number; direction: string | null }) =>
  d.direction
    ? t(`nearby.dir.${d.direction}`, {
        distance: formatDistance(d.distanceKm, locale.value, units.value),
      })
    : t('nearby.atCentre')
const districtName = useDistrictName(() => district.value?.at ?? null)
const districtLabel = computed(() =>
  district.value ? (districtName.data.value ?? where(district.value)) : ''
)

const stats = computed(() => {
  const s = summary.value
  if (!s?.offers.length) return null
  const n = s.offers.length
  const offers = nearby.complete.value
    ? t('nearby.offersCount', { n }, n)
    : t('nearby.offersNewest', { n }, n)
  return `${offers} ${t('nearby.fromSellers', { n: s.sellers.length }, s.sellers.length)}`
})

const radiusText = computed(() =>
  area.value ? formatRadius(area.value.radiusKm, locale.value, units.value) : ''
)
const wider = computed(() => {
  const r = area.value?.radiusKm
  return r === undefined ? null : (RADIUS_PRESETS.find((p) => p > r) ?? null)
})
function widen() {
  if (area.value && wider.value)
    location.setArea({ center: area.value.center, radiusKm: wider.value })
}

const locating = ref(false)
async function locateMe() {
  locating.value = true
  const point = await location.locate(true)
  locating.value = false
  if (point) location.setArea({ center: point, radiusKm: DEFAULT_RADIUS })
}

function openPlace(place: NearbyPlace) {
  location.setArea({ center: place.at, radiusKm: area.value?.radiusKm ?? DEFAULT_RADIUS })
  window.scrollTo({ top: 0 })
}

function toggle(cell: string | null) {
  selected.value = cell === selected.value ? null : cell
}

const allDistricts = ref(false)
watch(selected, () => (allDistricts.value = false))
</script>

<template>
  <AppLayout tab="search">
    <template #mobile-top>
      <PageTopBar :title="t('nearby.title')" :back="{ name: 'home' }">
        <button
          type="button"
          class="nearby__top-btn"
          :aria-label="t('location.title')"
          @click="ui.openLocation()"
        >
          <UiIcon name="location" :size="24" />
        </button>
      </PageTopBar>
    </template>

    <div class="container nearby" data-testid="nearby">
      <header class="nearby__head">
        <UiBreadcrumbs
          class="nearby__crumbs"
          :items="[
            { label: t('catalog.home'), to: { name: 'home' } },
            { label: t('nearby.title') },
          ]"
        />
        <h1 class="nearby__title">{{ t('nearby.title') }}</h1>
        <button type="button" class="nearby__area" @click="ui.openLocation()">
          <UiIcon name="location" :size="16" :stroke="2" />
          <span>{{ areaPhrase ?? t('location.allRegions') }} ·</span>
          <span class="nearby__change">{{ t('location.change') }}</span>
        </button>
        <p v-if="stats" class="nearby__stats" data-testid="nearby-stats">
          {{ stats }}
          <span v-if="!nearby.complete.value" class="nearby__note">{{
            t('nearby.newestNote')
          }}</span>
        </p>
      </header>

      <!-- No place chosen: «рядом» needs one. -->
      <SystemState
        v-if="!area"
        kind="nearby-place"
        icon="location"
        tone="primary"
        :title="t('nearby.noPlaceTitle')"
        :text="location.deviceStatus === 'denied' ? t('location.denied') : t('nearby.noPlaceText')"
      >
        <UiButton icon="send" :loading="locating" @click="locateMe">{{
          t('nearby.nearMe')
        }}</UiButton>
        <UiButton variant="neutral" @click="ui.openLocation()">{{
          t('nearby.choosePlace')
        }}</UiButton>
      </SystemState>

      <SystemState
        v-else-if="nearby.error.value"
        kind="nearby-error"
        icon="node"
        tone="danger"
        :title="t('list.errorTitle')"
        :text="t('list.errorText')"
      >
        <UiButton variant="contrast" icon="retry" @click="nearby.retry">{{
          t('list.retry')
        }}</UiButton>
      </SystemState>

      <div v-else-if="nearby.loading.value" class="nearby__loading" aria-busy="true">
        <UiSkeleton class="nearby__skeleton-map" radius="16px" />
        <div class="nearby__skeleton-tiles">
          <UiSkeleton v-for="i in 4" :key="i" height="132px" radius="16px" />
        </div>
      </div>

      <!-- Nothing here: where the nearest offers are. -->
      <div v-else-if="empty" class="nearby__empty" data-testid="nearby-empty">
        <SystemState
          kind="nearby-empty"
          icon="search-empty"
          :title="t('nearby.emptyTitle', { radius: radiusText })"
          :text="t('nearby.emptyText')"
        >
          <UiButton v-if="wider" @click="widen">{{
            t('nearby.widen', { radius: formatRadius(wider, locale, units) })
          }}</UiButton>
          <UiButton variant="neutral" @click="ui.openLocation()">{{
            t('nearby.otherPlace')
          }}</UiButton>
        </SystemState>
        <section
          v-if="nearest.loading.value || nearest.places.value.length"
          class="nearby__places"
          data-testid="nearby-places"
        >
          <h2 class="nearby__places-title">{{ t('nearby.nearestTitle') }}</h2>
          <p v-if="nearest.loading.value && !nearest.places.value.length" class="nearby__muted">
            {{ t('nearby.nearestLoading') }}
          </p>
          <ul class="nearby__places-list">
            <NearbyPlaceRow
              v-for="p in nearest.places.value"
              :key="p.cell"
              :place="p"
              @open="openPlace(p)"
            />
          </ul>
        </section>
      </div>

      <template v-else-if="summary && scoped && area">
        <section class="nearby__section" data-testid="nearby-where">
          <div class="nearby__section-head">
            <h2 class="nearby__h2">{{ t('nearby.whereTitle') }}</h2>
            <p class="nearby__sub">{{ t('nearby.whereSub') }}</p>
          </div>
          <div class="nearby__where">
            <NearbyMap
              class="nearby__map"
              :center="area.center"
              :radius-km="area.radiusKm"
              :districts="summary.districts"
              :selected="selected"
              @select="toggle"
            />
            <div class="nearby__districts" :class="{ 'nearby__districts--all': allDistricts }">
              <NearbyDistrict
                v-for="(d, i) in summary.districts"
                :key="d.cell"
                :class="{ 'nearby__district--extra': i >= PHONE_DISTRICTS }"
                :district="d"
                :named="i < NAMED_DISTRICTS"
                :selected="d.cell === selected"
                @select="toggle(d.cell)"
              />
              <button
                v-if="summary.districts.length > PHONE_DISTRICTS && !allDistricts"
                type="button"
                class="nearby__all-districts"
                @click="allDistricts = true"
              >
                {{ t('nearby.allDistricts', { n: summary.districts.length }) }}
              </button>
            </div>
          </div>
        </section>

        <div v-if="district" class="nearby__scope" data-testid="nearby-scope" role="status">
          <span class="nearby__scope-text">
            {{ t('nearby.districtChosen') }} <strong>{{ districtLabel }}</strong> ·
            {{ t('nearby.offersCount', { n: district.count }, district.count) }}
          </span>
          <button type="button" class="nearby__scope-reset" @click="selected = null">
            <UiIcon name="close" :size="16" :stroke="2" />{{ t('nearby.wholeArea') }}
          </button>
        </div>

        <section v-if="scoped.categories.length" class="nearby__section">
          <h2 class="nearby__h2">{{ t('nearby.whatTitle') }}</h2>
          <NearbyCategories :key="selected ?? ''" :categories="scoped.categories" />
        </section>

        <section v-if="scoped.sellers.length > 1" class="nearby__section">
          <h2 class="nearby__h2">{{ t('nearby.whoTitle') }}</h2>
          <NearbySellers :sellers="scoped.sellers.slice(0, SELLERS)" />
        </section>

        <section class="nearby__section" data-testid="nearby-fresh">
          <div class="nearby__section-head nearby__section-head--row">
            <h2 class="nearby__h2">
              {{ district ? t('nearby.freshInDistrict') : t('nearby.freshTitle') }}
            </h2>
            <RouterLink class="nearby__all" :to="categoryRoute(null)">
              {{ t('nearby.allOffers') }}<UiIcon name="chevron-right" :size="16" :stroke="2" />
            </RouterLink>
          </div>
          <OfferList :offers="scoped.offers.slice(0, FRESH)" :columns="5" :from="area.center" />
        </section>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
.nearby {
  padding-top: 16px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.nearby__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.nearby__title {
  margin: 4px 0 0;
  font-size: 32px;
  line-height: 40px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.nearby__area {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.nearby__change {
  color: var(--link);
  font-weight: 600;
}

.nearby__stats {
  margin: 4px 0 0;
  font-size: 16px;
  line-height: 22px;
  font-weight: 600;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}

.nearby__note,
.nearby__muted {
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  color: var(--text2);
}

.nearby__muted {
  margin: 0;
}

.nearby__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nearby__section-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nearby__section-head--row {
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.nearby__h2 {
  margin: 0;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.nearby__sub {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.nearby__where {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  height: 420px;
}

.nearby__map {
  min-height: 0;
}

.nearby__districts {
  min-height: 0;
  padding: 8px;
  border-radius: var(--radius-l);
  background: var(--surface);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nearby__scope {
  margin-bottom: -12px;
  padding: 12px 16px;
  border-radius: var(--radius-m);
  background: var(--primary-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 14px;
  line-height: 20px;
}

.nearby__scope-reset,
.nearby__all-districts {
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

/* The list scrolls next to the map; only the phone folds it after four. */
.nearby__all-districts {
  display: none;
}

.nearby__all {
  color: var(--link);
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
}

.nearby__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nearby__skeleton-map {
  height: 420px;
}

.nearby__skeleton-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.nearby__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.nearby__places {
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  padding: 20px 24px 8px;
  border-radius: 18px;
  background: var(--surface);
}

.nearby__places-title {
  margin: 0 0 8px;
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
}

.nearby__places-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.nearby__top-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nearby__area:focus-visible,
.nearby__scope-reset:focus-visible,
.nearby__all-districts:focus-visible,
.nearby__all:focus-visible,
.nearby__top-btn:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 3px var(--ring);
}

@media (max-width: 1099px) {
  .nearby__where {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

@media (max-width: 767px) {
  .nearby {
    padding-top: 12px;
    gap: 24px;
  }

  .nearby__crumbs,
  .nearby__title {
    display: none;
  }

  .nearby__head {
    gap: 4px;
  }

  .nearby__stats {
    font-size: 15px;
    line-height: 21px;
  }

  .nearby__h2 {
    font-size: 20px;
    line-height: 26px;
  }

  .nearby__sub {
    font-size: 13px;
    line-height: 18px;
  }

  .nearby__where {
    display: flex;
    flex-direction: column;
    height: auto;
    gap: 8px;
  }

  .nearby__map {
    height: 260px;
    margin: 0 -16px;
    border-radius: 0;
  }

  .nearby__districts {
    padding: 4px;
    overflow: visible;
  }

  .nearby__districts:not(.nearby__districts--all) .nearby__district--extra {
    display: none;
  }

  .nearby__all-districts {
    display: flex;
    padding: 10px 12px;
  }

  .nearby__skeleton-map {
    height: 260px;
  }

  .nearby__skeleton-tiles {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
