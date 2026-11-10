<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { PICKUP_STORAGE_DAYS } from '@/models/delivery'
import { MAX_ADDRESS, MAX_FINANCIAL_TERMS, MAX_ROUTE, MAX_SCHEDULE_INFO } from '@/models/draft'
import UiField from '@/ui/UiField.vue'
import UiInput from '@/ui/UiInput.vue'
import UiTextarea from '@/ui/UiTextarea.vue'
import ScheduleField from './ScheduleField.vue'
import StepHead from './StepHead.vue'

/**
 * Step 3 of a pickup point (s4-pvz): instead of exchange and price — the
 * point's terms, as the old form wrote them in `delivery.pickupPoint`. The
 * price is the minimum delivery cost, shown with «от». The storage period is
 * the old app's constant: the offer has no field for it.
 */
const { t } = useI18n()
const form = useOfferForm()
const d = computed(() => form.draft.value!)
const p = computed(() => d.value.point)
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="t('create.point.title')"
  />

  <div class="sp__row">
    <UiField
      v-slot="{ id, describedBy, invalid }"
      data-field="price"
      :label="t('create.point.cost')"
      :error="form.fieldError('price')"
    >
      <UiInput
        :id="id"
        v-model="d.price"
        suffix="PKOIN"
        inputmode="decimal"
        :aria-describedby="describedBy"
        :invalid="invalid"
        data-testid="create-point-cost"
      />
    </UiField>
    <UiField :label="t('create.point.storage')" :hint="t('create.point.storageHint')" group>
      <span class="sp__static">{{ t('create.point.storageValue', PICKUP_STORAGE_DAYS) }}</span>
    </UiField>
  </div>

  <UiField
    v-slot="{ id, describedBy, invalid }"
    data-field="financialTerms"
    :label="t('create.point.terms')"
    :hint="t('create.point.termsHint')"
    :error="form.fieldError('financialTerms')"
    :count="p.financialTerms.length"
    :max="MAX_FINANCIAL_TERMS"
  >
    <UiTextarea
      :id="id"
      v-model="p.financialTerms"
      :rows="3"
      :maxlength="MAX_FINANCIAL_TERMS"
      :aria-describedby="describedBy"
      :invalid="invalid"
      data-testid="create-point-terms"
    />
  </UiField>

  <ScheduleField :days="p.days" :error="form.fieldError('schedule')" />
  <UiTextarea
    v-model="p.scheduleInfo"
    :rows="2"
    :maxlength="MAX_SCHEDULE_INFO"
    :placeholder="t('create.point.scheduleInfo')"
    :aria-label="t('create.point.schedule')"
  />

  <UiField
    v-slot="{ id, describedBy, invalid }"
    data-field="address"
    :label="t('create.point.address')"
    :error="form.fieldError('address')"
    :count="p.address.length"
    :max="MAX_ADDRESS"
  >
    <UiInput
      :id="id"
      v-model="p.address"
      :maxlength="MAX_ADDRESS"
      :aria-describedby="describedBy"
      :invalid="invalid"
      data-testid="create-point-address"
    />
  </UiField>

  <UiField
    v-slot="{ id, describedBy, invalid }"
    data-field="route"
    :label="t('create.point.route')"
    :hint="t('create.point.routeHint')"
    :error="form.fieldError('route')"
  >
    <UiTextarea
      :id="id"
      v-model="p.route"
      :rows="3"
      :maxlength="MAX_ROUTE"
      :aria-describedby="describedBy"
      :invalid="invalid"
      data-testid="create-point-route"
    />
  </UiField>
</template>

<style scoped>
.sp__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.sp__static {
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--subtle);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--text2);
}

@media (max-width: 767px) {
  .sp__row {
    grid-template-columns: 1fr;
  }
}
</style>
