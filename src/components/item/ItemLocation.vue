<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { areaName, reverseGeocode } from '@/api/geo'
import PointsMap from '@/components/map/PointsMap.vue'
import { formatDistance } from '@/lib/area'
import { decodeGeohash, distanceKm } from '@/lib/geohash'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import ItemSection from './ItemSection.vue'

/**
 * «Местоположение» (s3-item): the district, the distance and a circle on the
 * map — the exact address the seller gives in the chat. The district comes
 * from Nominatim, one request per offer and only inside Bastyon.
 */
const props = defineProps<{ geohash: string; compact?: boolean }>()
const { t, locale } = useI18n()
const session = useSessionStore()
const location = useLocationStore()

const point = computed(() => decodeGeohash(props.geohash))
/** Coarse key: offers a few hundred metres apart share the answer. */
const key = computed(() => props.geohash.slice(0, 6))

const place = useQuery({
  queryKey: computed(() => ['geo', 'area', key.value, locale.value]),
  enabled: computed(() => session.mode === 'bastyon' && !!point.value),
  staleTime: Infinity,
  retry: false,
  queryFn: async ({ signal }) => {
    const found = await reverseGeocode(point.value!, { locale: locale.value, zoom: 14, signal })
    return found ? areaName(found.raw) : null
  },
})

const distance = computed(() => {
  const from = location.device ?? location.area?.center ?? null
  if (!from || !point.value) return null
  const text = formatDistance(distanceKm(from, point.value), locale.value, {
    km: t('location.km'),
    m: t('location.m'),
  })
  return location.device
    ? t('item.location.fromYou', { d: text })
    : t('item.location.fromCenter', { d: text })
})
</script>

<template>
  <ItemSection v-if="point" :title="t('item.location.title')" heading-id="item-location">
    <div class="iloc">
      <div class="iloc__text">
        <p
          v-if="place.data.value || place.isError.value || (compact && distance)"
          class="iloc__place"
        >
          {{ place.data.value ?? (place.isError.value ? t('item.location.unknown') : '') }}
          <template v-if="compact && distance"> · {{ distance }}</template>
        </p>
        <p v-if="!compact && distance" class="iloc__distance">{{ distance }}</p>
        <p class="iloc__note">{{ t('item.location.note') }}</p>
      </div>
      <PointsMap
        class="iloc__map"
        :circle="{ center: point, radiusKm: 0.6 }"
        :height="compact ? 156 : 200"
        :label="t('item.location.mapLabel')"
      />
    </div>
  </ItemSection>
</template>

<style scoped>
.iloc {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
  gap: 24px;
}

.iloc__text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.iloc__place {
  font-size: 15px;
  line-height: 22px;
}

.iloc__distance {
  color: var(--text2);
  font-size: 14px;
}

.iloc__note {
  margin-top: 6px;
  color: var(--text3);
  font-size: 12px;
  line-height: 16px;
}

@media (max-width: 767px) {
  .iloc {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .iloc__note {
    display: none;
  }
}
</style>
