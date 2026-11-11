<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCityName } from '@/composables/place-name'
import { formatDistance } from '@/lib/area'
import { encodeGeohash } from '@/lib/geohash'
import type { NearbyPlace } from '@/models/nearby'
import UiButton from '@/ui/UiButton.vue'

/** A place with offers near an empty area: the town, how far, how many; «Смотреть». */
const props = defineProps<{ place: NearbyPlace }>()
defineEmits<{ open: [] }>()
const { t, locale } = useI18n()
const city = useCityName(() => encodeGeohash(props.place.at, 5))

const where = computed(() => {
  const km = formatDistance(props.place.distanceKm, locale.value, {
    km: t('location.km'),
    m: t('location.m'),
  })
  return t(`nearby.dir.${props.place.direction}`, { distance: km })
})
const count = computed(() =>
  props.place.more
    ? t('nearby.offersMore', { n: props.place.count })
    : t('nearby.offersCount', { n: props.place.count }, props.place.count)
)
</script>

<template>
  <li class="nplace" :data-cell="place.cell">
    <span class="nplace__body">
      <span class="nplace__name">{{ city.data.value ?? where }}</span>
      <span class="nplace__meta">
        <template v-if="city.data.value">{{ where }} · </template>{{ count }}
      </span>
    </span>
    <UiButton variant="neutral" :size="36" @click="$emit('open')">{{ t('nearby.look') }}</UiButton>
  </li>
</template>

<style scoped>
.nplace {
  padding: 12px 0;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}

.nplace__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nplace__name {
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}

.nplace__meta {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}
</style>
