<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PointsMap, { type MapPoint } from '@/components/map/PointsMap.vue'
import UiButton from '@/ui/UiButton.vue'
import UiScreen from '@/ui/UiScreen.vue'
import type { PickupCard } from './ItemDelivery.vue'

/** Picking a pickup point on the phone (s3-pickupselect-mobile): map on top, list below. */
const props = defineProps<{ points: PickupCard[]; selected: string | null }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ pick: [id: string] }>()
const { t } = useI18n()
const name = `pp-${useId()}`

const current = ref<string | null>(null)
watch(
  open,
  (value) => {
    if (value) current.value = props.selected ?? props.points[0]?.id ?? null
  },
  { immediate: true }
)
const mapPoints = computed<MapPoint[]>(() =>
  props.points.flatMap((p) => (p.at ? [{ id: p.id, at: p.at, label: p.priceShort ?? '' }] : []))
)

function choose() {
  if (current.value) emit('pick', current.value)
  open.value = false
}
</script>

<template>
  <UiScreen v-model:open="open" :title="t('item.delivery.point')" dismiss="close">
    <PointsMap
      :points="mapPoints"
      :selected="current"
      :height="300"
      :label="t('item.delivery.mapLabel')"
      @select="current = $event"
    />
    <div class="pp">
      <div class="pp__head">
        <strong>{{ t('item.delivery.nearby', { n: points.length }, points.length) }}</strong>
        <span>{{ t('item.delivery.byPrice') }}</span>
      </div>
      <ul class="pp__list">
        <li v-for="p in points" :key="p.id">
          <label class="pp__item" :class="{ 'pp__item--on': p.id === current }">
            <input v-model="current" class="pp__radio" type="radio" :name="name" :value="p.id" />
            <span class="pp__body">
              <span class="pp__row">
                <strong>{{ p.title }}</strong>
                <span class="pp__price">{{ p.price }}</span>
              </span>
              <span class="pp__line">{{ p.line }}</span>
              <span v-if="p.open" class="pp__open" :class="`pp__open--${p.open.tone}`">{{
                p.open.text
              }}</span>
            </span>
          </label>
        </li>
      </ul>
    </div>
    <template #footer>
      <UiButton :size="52" block :disabled="!current" @click="choose">
        {{ t('item.delivery.choosePoint') }}
      </UiButton>
    </template>
  </UiScreen>
</template>

<style scoped>
.pp {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pp__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  color: var(--text2);
}

.pp__head strong {
  color: var(--text);
  font-size: 17px;
}

.pp__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pp__item {
  padding: 12px;
  border: 2px solid transparent;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  gap: 12px;
}

.pp__item--on {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.pp__radio {
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--primary);
}

.pp__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--text2);
}

.pp__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--text);
  font-size: 15px;
}

.pp__price {
  font-weight: 700;
}

.pp__open--success {
  color: var(--success);
}
</style>
