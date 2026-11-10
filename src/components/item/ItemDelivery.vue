<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import PointsMap, { type MapPoint } from '@/components/map/PointsMap.vue'
import type { LatLng } from '@/lib/geohash'
import type { DeliveryOptions, DeliveryPick } from '@/models/delivery'
import UiChoiceCard from '@/ui/UiChoiceCard.vue'
import ItemSection from './ItemSection.vue'

export interface PickupCard {
  id: string
  title: string
  /** «ул. Марксистская, 3 · ежедневно 10–21» */
  line: string
  /** «60 PKOIN» */
  price: string
  priceShort?: string
  at?: LatLng | null
  /** «Открыто до 21:00» */
  open?: { text: string; tone: 'success' | 'muted' } | null
  to: RouteLocationRaw
}

type Way = DeliveryPick['way']

/**
 * «Способы получения» (s3-item): the buyer picks one, it goes to the seller as
 * the first chat message. Pickup points come with a map and a list; on the
 * phone the list opens on its own screen («Изменить пункт»).
 */
const props = defineProps<{
  options: DeliveryOptions
  points: PickupCard[]
  pointsLoading?: boolean
  /** The owner looks at it: nothing to pick. */
  readonly?: boolean
  /** «Купить» was pressed without a choice: the block is outlined. */
  attention?: boolean
}>()
const pick = defineModel<DeliveryPick | null>({ default: null })
defineEmits<{ phonePicker: [] }>()
const { t } = useI18n()
const name = `delivery-${useId()}`

const way = computed<Way | undefined>({
  get: () => pick.value?.way,
  set: (value) => {
    if (value === 'pickupPoint') {
      const first = props.points[0]
      pick.value = first ? { way: 'pickupPoint', id: first.id } : null
    } else if (value) pick.value = { way: value }
  },
})
const pointId = computed(() => (pick.value?.way === 'pickupPoint' ? pick.value.id : null))
const chosenPoint = computed(() => props.points.find((p) => p.id === pointId.value) ?? null)

const cheapest = computed(() => {
  const prices = props.points.map((p) => p.priceShort).filter(Boolean)
  return prices[0] ?? null
})
const pointsSummary = computed(() => {
  if (props.pointsLoading) return t('item.delivery.pointsLoading')
  const n = props.points.length
  if (!n) return t('item.delivery.pointsNone')
  return cheapest.value
    ? t('item.delivery.pointsSummary', { n, price: cheapest.value }, n)
    : t('item.delivery.pointsCount', { n }, n)
})
const mapPoints = computed<MapPoint[]>(() =>
  props.points.flatMap((p) => (p.at ? [{ id: p.id, at: p.at, label: p.priceShort ?? '' }] : []))
)

function selectPoint(id: string) {
  if (!props.readonly) pick.value = { way: 'pickupPoint', id }
}
</script>

<template>
  <ItemSection
    id="item-delivery"
    :title="t('item.delivery.title')"
    :subtitle="readonly ? undefined : t('item.delivery.subtitle')"
    heading-id="item-delivery-title"
    :class="{ 'idl--attention': attention }"
  >
    <div class="idl__ways" role="radiogroup" :aria-labelledby="'item-delivery-title'">
      <UiChoiceCard
        v-if="options.pickupPoints.enabled"
        v-model="way"
        value="pickupPoint"
        :name="name"
        :title="t('item.delivery.point')"
        :description="chosenPoint ? undefined : pointsSummary"
        :disabled="readonly || (!pointsLoading && !points.length)"
      >
        <span v-if="chosenPoint" class="idl__chosen">
          {{ chosenPoint.title }} · {{ chosenPoint.price }}
        </span>
        <button
          v-if="chosenPoint && !readonly"
          type="button"
          class="idl__change"
          @click.prevent="$emit('phonePicker')"
        >
          {{ t('item.delivery.changePoint') }}
        </button>
      </UiChoiceCard>
      <UiChoiceCard
        v-if="options.selfPickup.enabled"
        v-model="way"
        value="selfPickup"
        :name="name"
        :title="t('item.delivery.self')"
        :description="options.selfPickup.info || t('item.delivery.selfDefault')"
        :disabled="readonly"
      />
      <UiChoiceCard
        v-if="options.directDelivery.enabled"
        v-model="way"
        value="directDelivery"
        :name="name"
        :title="t('item.delivery.direct')"
        :description="options.directDelivery.info || t('item.delivery.directDefault')"
        :disabled="readonly"
      />
    </div>

    <div
      v-if="options.pickupPoints.enabled && points.length && (way === 'pickupPoint' || readonly)"
      class="idl__points"
    >
      <PointsMap
        class="idl__map"
        :points="mapPoints"
        :selected="pointId"
        :height="256"
        :label="t('item.delivery.mapLabel')"
        @select="selectPoint"
      />
      <ul class="idl__list">
        <li v-for="p in points" :key="p.id">
          <label class="idl__point" :class="{ 'idl__point--on': p.id === pointId }">
            <input
              v-if="!readonly"
              class="idl__radio"
              type="radio"
              :name="`${name}-point`"
              :checked="p.id === pointId"
              @change="selectPoint(p.id)"
            />
            <span class="idl__point-body">
              <span class="idl__point-head">
                <strong>{{ p.title }}</strong>
                <span class="idl__price">{{ p.price }}</span>
              </span>
              <span class="idl__line">{{ p.line }}</span>
              <span v-if="p.open" class="idl__open" :class="`idl__open--${p.open.tone}`">{{
                p.open.text
              }}</span>
              <RouterLink class="idl__more" :to="p.to">{{
                t('item.delivery.pointMore')
              }}</RouterLink>
            </span>
          </label>
        </li>
      </ul>
    </div>
  </ItemSection>
</template>

<style scoped>
.idl--attention {
  box-shadow: 0 0 0 2px var(--primary);
}

.idl__ways {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.idl__chosen {
  display: block;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.idl__change {
  display: none;
  margin-top: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 13px / 18px var(--font-sans);
}

.idl__points {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
  gap: 16px;
  align-items: start;
}

.idl__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.idl__point {
  padding: 12px 14px;
  border: 2px solid transparent;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  gap: 12px;
  cursor: pointer;
}

.idl__point--on {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.idl__radio {
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--primary);
}

.idl__point-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.idl__point-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--text);
  font-size: 14px;
  line-height: 20px;
}

.idl__price {
  flex: none;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.idl__open--success {
  color: var(--success);
}

.idl__more {
  align-self: flex-start;
  color: var(--link);
}

@media (max-width: 1099px) {
  .idl__points {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .idl__ways {
    grid-template-columns: 1fr;
  }

  .idl__change {
    display: block;
  }

  /* The phone picks a point on its own screen. */
  .idl__points {
    display: none;
  }
}
</style>
