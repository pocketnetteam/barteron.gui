<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FoundPlace } from '@/api/geo'
import { useAddressSearch } from '@/composables/address-search'
import { DEFAULT_RADIUS, formatRadius, RADIUS_PRESETS, radiusPreset } from '@/lib/area'
import type { LatLng } from '@/lib/geohash'
import AreaMap from '@/components/map/AreaMap.vue'
import { useLocationStore } from '@/stores/location'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Где искать» (s2-nav-desktop, s2-location-mobile): centre and radius of the
 * place filter. Saving turns the filter on for every list; «Все регионы»
 * turns it off and keeps the centre for next time, like the old app.
 */
withDefaults(defineProps<{ mapLink?: boolean; titled?: boolean }>(), { titled: true })
const emit = defineEmits<{ done: [] }>()

const { t, locale } = useI18n()
const location = useLocationStore()

const center = ref<LatLng>(location.mapCenter)
const radius = ref(location.area?.radiusKm ?? DEFAULT_RADIUS)
const units = computed(() => ({ km: t('location.km'), m: t('location.m') }))
const preset = computed(() => radiusPreset(radius.value))
const changed = computed(
  () =>
    !location.filtered ||
    radius.value !== location.area?.radiusKm ||
    center.value[0] !== location.area?.center[0] ||
    center.value[1] !== location.area?.center[1]
)

const search = useAddressSearch()
const { query, results, searching } = search
const searchFailed = search.failed

function pick(place: FoundPlace) {
  center.value = place.point
  search.clear()
}

const locating = ref(false)
async function locate() {
  locating.value = true
  const point = await location.locate(true)
  locating.value = false
  if (point) center.value = point
}

function save() {
  location.setArea({ center: center.value, radiusKm: radius.value })
  emit('done')
}

function everywhere() {
  location.reset(true)
  emit('done')
}
</script>

<template>
  <div class="loc" data-testid="location-panel">
    <div class="loc__head" :class="{ 'loc__head--bare': !titled }">
      <h2 v-if="titled" class="loc__title">{{ t('location.title') }}</h2>
      <span v-if="location.filtered" class="loc__badge loc__badge--on">
        <span class="loc__dot" aria-hidden="true" />{{ t('location.filterOn') }}
      </span>
      <span v-else class="loc__badge">{{ t('location.everywhere') }}</span>
    </div>

    <div class="loc__search">
      <label class="loc__field">
        <UiIcon name="search" :size="18" />
        <span class="visually-hidden">{{ t('location.addressLabel') }}</span>
        <input
          v-model="query"
          type="search"
          class="loc__input"
          :placeholder="t('location.addressPlaceholder')"
          autocomplete="off"
        />
      </label>
      <button
        type="button"
        class="loc__locate"
        :aria-label="t('location.locate')"
        :disabled="locating"
        @click="locate"
      >
        <UiIcon name="send" :size="18" />
      </button>
      <ul v-if="results.length" class="loc__results" role="listbox">
        <li v-for="place in results" :key="place.point.join()">
          <button type="button" class="loc__result" @click="pick(place)">{{ place.label }}</button>
        </li>
      </ul>
      <p v-else-if="searching" class="loc__note">{{ t('location.searching') }}</p>
      <p v-else-if="searchFailed" class="loc__note">{{ t('location.searchFailed') }}</p>
      <p v-if="location.deviceStatus === 'denied'" class="loc__note">
        {{ t('location.denied') }}
      </p>
    </div>

    <AreaMap v-model:center="center" :radius-km="radius" :height="170" />

    <div class="loc__group">
      <span id="loc-radius" class="loc__label">{{ t('location.radius') }}</span>
      <div class="loc__chips" role="radiogroup" aria-labelledby="loc-radius">
        <button
          v-for="km in RADIUS_PRESETS"
          :key="km"
          type="button"
          role="radio"
          class="loc__chip"
          :class="{ 'loc__chip--on': preset === km }"
          :aria-checked="preset === km"
          @click="radius = km"
        >
          {{ formatRadius(km, locale, units) }}
        </button>
      </div>
    </div>

    <div class="loc__actions">
      <UiButton variant="neutral" :size="44" @click="everywhere">
        {{ t('location.allRegions') }}
      </UiButton>
      <UiButton :size="44" :disabled="!changed" data-testid="location-save" @click="save">
        {{ t('location.save') }}
      </UiButton>
    </div>
    <RouterLink
      v-if="mapLink"
      class="loc__map-link"
      :to="{ name: 'categoryMap', params: { id: 'search' } }"
      @click="emit('done')"
    >
      <UiIcon name="location" :size="16" />{{ t('location.openMap') }}
    </RouterLink>
  </div>
</template>

<style scoped>
.loc {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.loc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.loc__head--bare {
  justify-content: flex-start;
}

.loc__title {
  margin: 0;
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
}

.loc__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}

.loc__badge--on {
  background: var(--success-soft);
  color: var(--success);
}

.loc__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.loc__search {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc__field {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.loc__field:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.loc__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.loc__input::placeholder {
  color: var(--text3);
}

.loc__locate {
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--link);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loc__locate:hover {
  background: var(--muted-hover);
}

.loc__locate:focus-visible,
.loc__chip:focus-visible,
.loc__result:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.loc__results {
  width: 100%;
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: var(--radius-m);
  background: var(--surface);
  box-shadow: var(--shadow-2);
}

.loc__result {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  font: 400 14px / 20px var(--font-sans);
  text-align: left;
}

.loc__result:hover {
  background: var(--muted);
}

.loc__note {
  width: 100%;
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.loc__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loc__label {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.loc__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.loc__chip {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text);
  font: 400 13px / 18px var(--font-sans);
}

.loc__chip:hover {
  background: var(--muted-hover);
}

.loc__chip--on,
.loc__chip--on:hover {
  background: var(--contrast);
  color: var(--on-contrast);
  font-weight: 600;
}

.loc__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.loc__map-link {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--link);
}
</style>
