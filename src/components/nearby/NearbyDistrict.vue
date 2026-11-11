<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import { useDistrictName } from '@/composables/place-name'
import { formatDistance } from '@/lib/area'
import type { NearbyDistrict } from '@/models/nearby'

/**
 * One district in the list: its name from OpenStreetMap when Bastyon is the
 * host (else where it is from the centre), how many offers, what is sold.
 */
const props = defineProps<{
  district: NearbyDistrict
  selected: boolean
  /** Ask OpenStreetMap for the name: only the first few districts, Nominatim is rate-limited. */
  named?: boolean
}>()
defineEmits<{ select: [] }>()
const { t, locale } = useI18n()
const categories = useCategories()
const name = useDistrictName(() => (props.named || props.selected ? props.district.at : null))

const where = computed(() => {
  const d = props.district
  if (!d.direction) return t('nearby.atCentre')
  const km = formatDistance(d.distanceKm, locale.value, {
    km: t('location.km'),
    m: t('location.m'),
  })
  return t(`nearby.dir.${d.direction}`, { distance: km })
})
const what = computed(() =>
  props.district.categories
    .slice(0, 3)
    .map((id) => categories.label(id))
    .filter(Boolean)
    .join(', ')
)
</script>

<template>
  <button
    type="button"
    class="ndist"
    :class="{ 'ndist--on': selected }"
    :aria-pressed="selected"
    :data-cell="district.cell"
    @click="$emit('select')"
  >
    <span class="ndist__count">{{ district.count }}</span>
    <span class="ndist__body">
      <span class="ndist__name">{{ name.data.value ?? where }}</span>
      <span class="ndist__meta">
        <template v-if="name.data.value">{{ where }} · </template>{{ what }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.ndist {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-m);
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.ndist:hover {
  background: var(--muted);
}

.ndist--on,
.ndist--on:hover {
  background: var(--primary-soft);
}

.ndist:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ndist__count {
  flex: none;
  min-width: 40px;
  height: 40px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #fff;
  font: 700 14px / 40px var(--font-sans);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.ndist--on .ndist__count {
  background: var(--contrast);
  color: var(--on-contrast);
}

.ndist__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ndist__name {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ndist__meta {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
