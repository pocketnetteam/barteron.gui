<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBarteron } from '@/api/queries'
import PointsMap, { type MapPoint } from '@/components/map/PointsMap.vue'
import { isPickupPointOwner } from '@/config/delivery'
import { formatPkoin } from '@/lib/format'
import {
  approximateBounds,
  boundsAround,
  decodeGeohash,
  distanceKm,
  type LatLng,
} from '@/lib/geohash'
import { pickupPointInfo } from '@/models/delivery'
import { isOfferActive, PICKUP_POINT_CATEGORY, type Offer } from '@/models/offer'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * «Найти пункт на карте» (s4-step4): pickup points around the offer's place.
 * As in the old form: the feed of category 97 in the area, only points of the
 * addresses allowed to run them (`delivery_data.json`).
 */
const props = defineProps<{ center: LatLng; selected: readonly string[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ toggle: [id: string] }>()

const { t, locale } = useI18n()
const barteron = useBarteron()

/** Side of the square searched, km: a city and its suburbs. */
const AREA_KM = 50

const points = useQuery({
  queryKey: computed(() => [
    'barteron',
    'pickup-near',
    props.center[0].toFixed(2),
    props.center[1].toFixed(2),
  ]),
  enabled: computed(() => !!barteron.value),
  queryFn: async () => {
    const offers = await barteron.value!.api.feed({
      tags: [PICKUP_POINT_CATEGORY],
      location: approximateBounds(boundsAround(props.center, AREA_KM)),
      pageSize: 100,
    })
    return offers.filter((o) => isPickupPointOwner(o.address) && isOfferActive(o))
  },
})

const rows = computed(() =>
  (points.data.value ?? [])
    .map((offer) => {
      const at = decodeGeohash(offer.geohash)
      return {
        offer,
        at,
        km: at ? distanceKm(props.center, at) : null,
        address: pickupPointInfo(offer).address,
      }
    })
    .sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9))
)

const mapPoints = computed<MapPoint[]>(() =>
  rows.value.flatMap((r) =>
    r.at && r.offer.hash
      ? [{ id: r.offer.hash, at: r.at, label: formatPkoin(r.offer.priceCents / 100, locale.value) }]
      : []
  )
)

const price = (offer: Offer) =>
  t('create.place.priceFrom', {
    price: `${formatPkoin(offer.priceCents / 100, locale.value)} PKOIN`,
  })
const km = (value: number | null) =>
  value === null
    ? ''
    : new Intl.NumberFormat(locale.value, {
        style: 'unit',
        unit: 'kilometer',
        maximumFractionDigits: 1,
      }).format(value)
</script>

<template>
  <UiDialog v-model:open="open" :title="t('create.place.pointsTitle')" :width="880">
    <div class="ps" data-testid="create-pickup-search">
      <PointsMap
        v-if="mapPoints.length"
        :points="mapPoints"
        :selected="selected[selected.length - 1] ?? null"
        :height="260"
        :label="t('create.place.pointsTitle')"
        @select="emit('toggle', $event)"
      />

      <div
        v-if="points.isPending.value"
        class="ps__loading"
        :aria-label="t('create.place.pointsLoading')"
      >
        <UiSkeleton v-for="i in 3" :key="i" height="56px" radius="12px" />
      </div>
      <p v-else-if="points.isError.value" class="ps__empty">{{ t('create.place.pointsFailed') }}</p>
      <p v-else-if="!rows.length" class="ps__empty">{{ t('create.place.pointsEmpty') }}</p>

      <ul v-else class="ps__list">
        <li v-for="r in rows" :key="r.offer.hash!" class="ps__row">
          <span class="ps__body">
            <span class="ps__name">{{ r.offer.caption }}</span>
            <span class="ps__meta">{{ [r.address, km(r.km)].filter(Boolean).join(' · ') }}</span>
          </span>
          <span class="ps__price tabular">{{ price(r.offer) }}</span>
          <UiButton
            :variant="selected.includes(r.offer.hash!) ? 'secondary' : 'neutral'"
            :size="36"
            :icon="selected.includes(r.offer.hash!) ? 'check' : undefined"
            :aria-pressed="selected.includes(r.offer.hash!)"
            :data-testid="`create-pickup-${r.offer.hash}`"
            @click="emit('toggle', r.offer.hash!)"
          >
            {{
              selected.includes(r.offer.hash!) ? t('create.place.chosen') : t('create.place.choose')
            }}
          </UiButton>
        </li>
      </ul>
    </div>
    <template #actions>
      <UiButton data-testid="create-pickup-done" @click="open = false">
        {{ t('create.place.done') }}
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.ps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ps__loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ps__empty {
  margin: 0;
  padding: 16px 0;
  color: var(--text2);
  font-size: 14px;
}

.ps__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 40vh;
  overflow-y: auto;
}

.ps__row {
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.ps__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ps__name {
  font-size: 15px;
  font-weight: 600;
}

.ps__meta {
  font-size: 13px;
  color: var(--text2);
}

.ps__price {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .ps__row {
    flex-wrap: wrap;
  }

  .ps__body {
    flex-basis: 100%;
  }

  .ps__price {
    flex: 1;
  }
}
</style>
