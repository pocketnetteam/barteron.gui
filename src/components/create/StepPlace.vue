<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOffersByIds } from '@/api/queries'
import PlaceMap from '@/components/map/PlaceMap.vue'
import { ADDRESS_NOTE_TEXT, useAddressSearch } from '@/composables/address-search'
import { useOfferForm } from '@/composables/offer-form'
import { usePlaceName } from '@/composables/place-name'
import { formatPkoin } from '@/lib/format'
import { decodeGeohash, encodeGeohash, type LatLng } from '@/lib/geohash'
import { pickupPointInfo } from '@/models/delivery'
import { isPointDraft, MAX_DELIVERY_INFO } from '@/models/draft'
import { useLocationStore } from '@/stores/location'
import { showToast } from '@/ui/toast'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSwitch from '@/ui/UiSwitch.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import StepHead from './StepHead.vue'

const PickupSearchDialog = defineAsyncComponent(() => import('./PickupSearchDialog.vue'))

/**
 * Step 4 (s4-step4): the offer's point on the map and how the buyer gets the
 * item. A pickup point only sets its place: it is a way of delivery itself.
 */
const { t, locale } = useI18n()
const form = useOfferForm()
const location = useLocationStore()
const d = computed(() => form.draft.value!)
const point = computed(() => isPointDraft(d.value))

const at = computed(() => decodeGeohash(d.value.geohash))
const placeName = usePlaceName(() => d.value.geohash)
const center = computed<LatLng>(() => location.device ?? location.mapCenter)
/** Pickup points are looked for around the point: while some are chosen, it stays put. */
const locked = computed(
  () => !point.value && d.value.pickupPoints.on && d.value.pickupPoints.ids.length > 0
)

function setPoint(value: LatLng) {
  if (locked.value) return
  d.value.geohash = encodeGeohash(value)
}

// Address search
const search = useAddressSearch()
function choose(place: { point: LatLng; label: string }) {
  setPoint(place.point)
  search.clear()
}

const locating = ref(false)
async function locate() {
  locating.value = true
  const found = await location.locate(true)
  locating.value = false
  if (found) setPoint(found)
  else showToast(t('create.place.locateFailed'))
}

// Pickup points
const points = useOffersByIds(() => d.value.pickupPoints.ids)
const chosen = computed(() =>
  d.value.pickupPoints.ids.map((id) => {
    const offer = points.data.value?.find((o) => o.hash === id)
    return {
      id,
      name: offer?.caption ?? '…',
      address: offer ? pickupPointInfo(offer).address : '',
      price: offer ? `${formatPkoin(offer.priceCents / 100, locale.value)} PKOIN` : '',
    }
  })
)
const needPlace = ref(false)
/** A refused switch is drawn anew: its checkbox already flipped. */
const pointsSwitchKey = ref(0)
function onPointsSwitch(on: boolean) {
  if (on && !d.value.geohash) {
    needPlace.value = true
    pointsSwitchKey.value++
    return
  }
  needPlace.value = false
  d.value.pickupPoints.on = on
}
const searchOpen = ref(false)
function togglePoint(id: string) {
  const ids = d.value.pickupPoints.ids
  d.value.pickupPoints.ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="point ? t('create.place.titlePoint') : t('create.place.title')"
  />

  <section class="spl__section" data-field="place">
    <h2 v-if="!point" class="spl__title">{{ t('create.place.where') }}</h2>
    <div class="spl__search">
      <label class="spl__input" :class="{ 'spl__input--off': locked }">
        <UiIcon name="search" :size="18" />
        <span class="visually-hidden">{{ t('create.place.search') }}</span>
        <input
          v-model="search.query.value"
          type="search"
          autocomplete="off"
          :placeholder="placeName.data.value ?? t('create.place.search')"
          :disabled="locked"
          data-testid="create-place-search"
        />
      </label>
      <UiButton
        variant="secondary"
        :size="48"
        icon="send"
        :loading="locating"
        :disabled="locked"
        data-testid="create-locate"
        @click="locate"
      >
        {{ t('create.place.locate') }}
      </UiButton>
    </div>
    <ul v-if="search.results.value.length" class="spl__results">
      <li v-for="r in search.results.value" :key="r.label">
        <button type="button" class="spl__result" @click="choose(r)">{{ r.label }}</button>
      </li>
    </ul>
    <p v-else-if="search.note.value" class="spl__note" data-testid="create-place-note">
      {{ t(ADDRESS_NOTE_TEXT[search.note.value]) }}
    </p>

    <PlaceMap
      :point="at"
      :center="center"
      :locked="locked"
      :label="t('create.place.mapLabel')"
      @update:point="setPoint"
    />
    <p v-if="at" class="spl__place" data-testid="create-place-name">
      <UiIcon name="location" :size="16" />
      {{ placeName.data.value ?? t('create.place.pointOnMap') }}
    </p>
    <p v-if="form.fieldError('place')" class="spl__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('place') }}
    </p>
    <p class="spl__hint">{{ point ? t('create.place.hintPoint') : t('create.place.hint') }}</p>
  </section>

  <section v-if="!point" class="spl__section spl__section--delivery" data-field="delivery">
    <div>
      <h2 class="spl__title">{{ t('create.place.delivery') }}</h2>
      <p class="spl__hint">{{ t('create.place.deliveryHint') }}</p>
    </div>

    <div class="spl__card" :class="{ 'spl__card--on': d.selfPickup.on }">
      <div class="spl__card-head">
        <UiIcon name="location" :size="20" />
        <span class="spl__card-title">{{ t('create.place.selfPickup') }}</span>
        <UiSwitch
          v-model="d.selfPickup.on"
          :aria-label="t('create.place.selfPickup')"
          data-testid="create-self-pickup"
        />
      </div>
      <UiTextarea
        v-if="d.selfPickup.on"
        v-model="d.selfPickup.info"
        :rows="2"
        :maxlength="MAX_DELIVERY_INFO"
        :placeholder="t('create.place.selfPickupPlaceholder')"
        :aria-label="t('create.place.selfPickup')"
      />
    </div>

    <div class="spl__card" :class="{ 'spl__card--on': d.directDelivery.on }">
      <div class="spl__card-head">
        <UiIcon name="delivery" :size="20" />
        <span class="spl__card-title">{{ t('create.place.directDelivery') }}</span>
        <UiSwitch
          v-model="d.directDelivery.on"
          :aria-label="t('create.place.directDelivery')"
          data-testid="create-direct-delivery"
        />
      </div>
      <UiTextarea
        v-if="d.directDelivery.on"
        v-model="d.directDelivery.info"
        :rows="2"
        :maxlength="MAX_DELIVERY_INFO"
        :placeholder="t('create.place.directDeliveryPlaceholder')"
        :aria-label="t('create.place.directDelivery')"
      />
    </div>

    <div class="spl__card" :class="{ 'spl__card--on spl__card--points': d.pickupPoints.on }">
      <div class="spl__card-head">
        <UiIcon name="pickup-point" :size="20" />
        <span class="spl__card-title">{{ t('create.place.pickupPoints') }}</span>
        <UiSwitch
          :key="pointsSwitchKey"
          :model-value="d.pickupPoints.on"
          :aria-label="t('create.place.pickupPoints')"
          data-testid="create-pickup-points"
          @update:model-value="onPointsSwitch"
        />
      </div>
      <UiAlert v-if="needPlace" tone="warning" icon="warning">{{
        t('create.place.needPlace')
      }}</UiAlert>
      <template v-if="d.pickupPoints.on">
        <UiAlert v-if="locked" tone="info" icon="info">{{ t('create.place.locked') }}</UiAlert>
        <ul v-if="chosen.length" class="spl__points">
          <li v-for="p in chosen" :key="p.id" class="spl__point" data-testid="create-pickup-chosen">
            <span class="spl__point-body">
              <span class="spl__point-name">{{ p.name }}</span>
              <span v-if="p.address" class="spl__point-address">{{ p.address }}</span>
            </span>
            <span v-if="p.price" class="spl__point-price tabular">
              {{ t('create.place.priceFrom', { price: p.price }) }}
            </span>
            <button
              type="button"
              class="spl__point-remove"
              :aria-label="t('create.place.removePoint', { name: p.name })"
              @click="togglePoint(p.id)"
            >
              <UiIcon name="close" :size="18" :stroke="2" />
            </button>
          </li>
        </ul>
        <button
          type="button"
          class="spl__find"
          data-testid="create-find-pickup"
          @click="searchOpen = true"
        >
          <UiIcon name="plus" :size="16" :stroke="2.4" />{{ t('create.place.findPoint') }}
        </button>
        <p v-if="form.fieldError('delivery')" class="spl__error" role="alert">
          <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('delivery') }}
        </p>
      </template>
    </div>
  </section>

  <PickupSearchDialog
    v-if="searchOpen && at"
    v-model:open="searchOpen"
    :center="at"
    :selected="d.pickupPoints.ids"
    @toggle="togglePoint"
  />
</template>

<style scoped>
.spl__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spl__section--delivery {
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.spl__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.spl__search {
  display: flex;
  gap: 8px;
}

.spl__input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: var(--muted);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text3);
}

.spl__input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.spl__input--off {
  opacity: 0.6;
}

.spl__input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 16px;
}

.spl__input input::placeholder {
  color: var(--text2);
}

.spl__results {
  list-style: none;
  margin: -4px 0 0;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-2);
}

.spl__result {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.spl__result:hover {
  background: var(--muted);
}

.spl__result:focus-visible,
.spl__point-remove:focus-visible,
.spl__find:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.spl__note,
.spl__hint {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

.spl__place {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.spl__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

.spl__card {
  padding: 16px;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spl__card--points {
  border: 2px solid var(--primary);
  padding: 15.5px;
}

.spl__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.spl__card-head > :first-child {
  color: var(--primary);
}

.spl__card-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.spl__points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spl__point {
  padding: 10px 8px 10px 12px;
  border-radius: 12px;
  background: var(--subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.spl__point-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spl__point-name {
  font-size: 14px;
  font-weight: 600;
}

.spl__point-address {
  font-size: 13px;
  color: var(--text2);
}

.spl__point-price {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.spl__point-remove {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.spl__find {
  align-self: flex-start;
  height: 40px;
  padding: 0 14px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.spl__find:hover {
  border-color: var(--primary);
}
</style>
