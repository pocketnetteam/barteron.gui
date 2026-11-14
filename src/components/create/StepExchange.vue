<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CURRENCIES } from '@/api/rates'
import { cabinetRoute } from '@/composables/cabinet'
import { useOfferForm } from '@/composables/offer-form'
import { formatMoney, formatPkoin } from '@/lib/format'
import {
  draftPrice,
  parsePrice,
  PKOIN,
  PKOIN_CATEGORY,
  safeDealPossible,
  tidyPrice,
  type ExchangeMode,
  type FeeVariant,
} from '@/models/draft'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiBadge from '@/ui/UiBadge.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSelect from '@/ui/UiSelect.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import UiSwitch from '@/ui/UiSwitch.vue'
import ExchangeTags from './ExchangeTags.vue'
import StepHead from './StepHead.vue'

/** Step 3 (s4-step3): what the seller wants, the price, the safe deal. */
const { t, locale } = useI18n()
const form = useOfferForm()
const currency = useCurrencyStore()
const { categories, rates, myList } = form
const session = useSessionStore()
const d = computed(() => form.draft.value!)

const modes = computed<{ value: ExchangeMode; title: string; text: string }[]>(() => [
  { value: 'own', title: t('create.exchange.own'), text: t('create.exchange.ownText') },
  { value: 'my_list', title: t('create.exchange.myList'), text: t('create.exchange.myListText') },
  {
    value: 'anything',
    title: t('create.exchange.anything'),
    text: t('create.exchange.anythingText'),
  },
  {
    value: 'for_nothing',
    title: t('create.exchange.forNothing'),
    text: t('create.exchange.forNothingText'),
  },
])

const label = (id: number) => categories.label(id) ?? String(id)

// Price
const currencies = computed(() => [
  { value: PKOIN, label: 'PKOIN' },
  ...CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` })),
])
const inCurrency = computed(() => d.value.currency !== PKOIN)
const price = computed(() => draftPrice(d.value, rates.data.value ?? null, locale.value))
/** «≈ 1 250 PKOIN» for a currency price, «≈ 12 400 ₽» for a PKOIN one. */
const equivalent = computed(() => {
  const amount = parsePrice(d.value.price, locale.value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (inCurrency.value) {
    return price.value.ok ? `≈ ${formatPkoin(price.value.pkoin, locale.value)} PKOIN` : null
  }
  const code = currency.shown
  const rate = code ? rates.data.value?.[code] : undefined
  return code && rate ? `≈ ${formatMoney(amount * rate, code, locale.value)}` : null
})
const rateMissing = computed(
  () => inCurrency.value && !rates.isPending.value && !rates.data.value?.[d.value.currency]
)

/** «12.400» typed in Serbian becomes «12400» on leaving the field (finding 19). */
function onPriceLeft() {
  d.value.price = tidyPrice(d.value.price, locale.value)
}

function onCurrency(value: string | undefined) {
  if (!value) return
  const switching = (value === PKOIN) !== (d.value.currency === PKOIN)
  d.value.currency = value
  if (switching) d.value.fixCurrency = value !== PKOIN
}

// Safe deal
const safePossible = computed(() => safeDealPossible(d.value, myList.value))
const fees = computed<{ value: FeeVariant; title: string; text: string }[]>(() => [
  { value: '', title: t('create.exchange.feeNone'), text: t('create.exchange.feeNoneText') },
  { value: 'inHalf', title: t('create.exchange.feeHalf'), text: t('create.exchange.feeHalfText') },
  {
    value: 'seller',
    title: t('create.exchange.feeSeller'),
    text: t('create.exchange.feeSellerText'),
  },
])
const canAddPkoin = computed(() => d.value.exchange === 'own' || d.value.exchange === 'anything')
function addPkoin() {
  if (d.value.exchange === 'anything') d.value.exchange = 'own'
  if (!d.value.tags.includes(PKOIN_CATEGORY)) d.value.tags.push(PKOIN_CATEGORY)
}
</script>

<template>
  <StepHead
    :n="form.stepIndex.value + 1"
    :total="form.steps.value.length"
    :title="t('create.exchange.title')"
  />

  <div class="sx__modes" role="radiogroup" :aria-label="t('create.exchange.title')">
    <label
      v-for="m in modes"
      :key="m.value"
      class="sx__mode"
      :class="{ 'sx__mode--on': d.exchange === m.value }"
      :data-testid="`create-mode-${m.value}`"
    >
      <input
        v-model="d.exchange"
        class="visually-hidden"
        type="radio"
        name="exchange"
        :value="m.value"
      />
      <span class="sx__mode-title">{{ m.title }}</span>
      <span class="sx__mode-text">{{ m.text }}</span>
    </label>
  </div>

  <ExchangeTags v-if="d.exchange === 'own'" />
  <div v-else-if="d.exchange === 'my_list'" class="sx__mylist" data-field="tags">
    <ul v-if="myList.length" class="sx__chips">
      <li
        v-for="id in myList"
        :key="id"
        class="sx__chip"
        :class="{ 'sx__chip--pkoin': id === PKOIN_CATEGORY }"
      >
        {{ label(id) }}
      </li>
    </ul>
    <UiAlert v-else tone="warning" icon="warning">{{ t('create.exchange.myListEmpty') }}</UiAlert>
    <p class="sx__hint">
      {{ t('create.exchange.myListHint') }}
      <RouterLink
        class="sx__link"
        :to="cabinetRoute(session.address, 'mylist')"
        data-testid="create-mylist-edit"
        >{{ t('create.exchange.myListEdit') }}</RouterLink
      >
    </p>
    <p v-if="form.fieldError('tags')" class="sx__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('tags') }}
    </p>
  </div>
  <p v-else-if="d.exchange === 'anything'" class="sx__hint">
    {{ t('create.exchange.anythingNote') }}
  </p>
  <p v-else class="sx__hint">{{ t('create.exchange.freeNote') }}</p>

  <template v-if="d.exchange !== 'for_nothing'">
    <section class="sx__section" data-field="price">
      <h2 class="sx__title">{{ t('create.exchange.price') }}</h2>
      <div class="sx__price-row">
        <div class="sx__amount" :class="{ 'sx__amount--error': form.fieldError('price') }">
          <label class="sx__amount-label" for="create-price">{{
            t('create.exchange.amount')
          }}</label>
          <div class="sx__amount-box">
            <input
              id="create-price"
              v-model="d.price"
              class="sx__amount-input tabular"
              inputmode="decimal"
              autocomplete="off"
              :aria-invalid="!!form.fieldError('price')"
              data-testid="create-price"
              @blur="onPriceLeft"
            />
            <UiSelect
              class="sx__currency"
              :model-value="d.currency"
              :options="currencies"
              :size="48"
              :label="t('create.exchange.currency')"
              data-testid="create-currency"
              @update:model-value="onCurrency"
            />
          </div>
        </div>
        <div v-if="equivalent" class="sx__equiv">
          <span class="sx__equiv-label">{{ t('create.exchange.inOffer') }}</span>
          <span class="sx__equiv-value tabular" data-testid="create-equivalent">{{
            equivalent
          }}</span>
        </div>
      </div>
      <p v-if="form.fieldError('price')" class="sx__error" role="alert">
        <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('price') }}
      </p>

      <p v-if="inCurrency && rates.isPending.value" class="sx__loading">
        <UiSpinner :size="16" />{{ t('create.exchange.ratesLoading') }}
      </p>
      <UiAlert v-else-if="rateMissing" tone="warning" icon="warning">
        {{ t('create.exchange.ratesFailed', { currency: d.currency }) }}
        <template #action>
          <UiButton variant="neutral" :size="36" @click="rates.refetch()">
            {{ t('create.exchange.retry') }}
          </UiButton>
        </template>
      </UiAlert>

      <div v-if="inCurrency" class="sx__toggle">
        <span class="sx__toggle-text">
          <span class="sx__toggle-title">{{
            t('create.exchange.fix', { currency: d.currency })
          }}</span>
          <span class="sx__toggle-hint">
            {{ d.fixCurrency ? t('create.exchange.fixHint') : t('create.exchange.fixOffHint') }}
          </span>
        </span>
        <UiSwitch
          v-model="d.fixCurrency"
          :aria-label="t('create.exchange.fix', { currency: d.currency })"
        />
      </div>
      <div class="sx__toggle">
        <span class="sx__toggle-text">
          <span class="sx__toggle-title">{{ t('create.exchange.from') }}</span>
          <span class="sx__toggle-hint">{{ t('create.exchange.fromHint') }}</span>
        </span>
        <UiSwitch
          v-model="d.priceFrom"
          :aria-label="t('create.exchange.from')"
          data-testid="create-price-from"
        />
      </div>
    </section>

    <section class="sx__section">
      <div class="sx__safe-head">
        <h2 class="sx__title">{{ t('create.exchange.safe') }}</h2>
        <UiBadge :tone="safePossible ? 'success' : 'neutral'" :dot="safePossible">
          {{ safePossible ? t('create.exchange.safeOn') : t('create.exchange.safeOff') }}
        </UiBadge>
      </div>
      <template v-if="safePossible">
        <p class="sx__text">{{ t('create.exchange.safeOnText') }}</p>
        <div class="sx__fees" role="radiogroup" :aria-label="t('create.exchange.safe')">
          <label
            v-for="f in fees"
            :key="f.value"
            class="sx__fee"
            :class="{ 'sx__fee--on': d.fee === f.value }"
            :data-testid="`create-fee-${f.value || 'buyer'}`"
          >
            <input
              v-model="d.fee"
              class="visually-hidden"
              type="radio"
              name="fee"
              :value="f.value"
            />
            <span class="sx__fee-dot" aria-hidden="true" />
            <span class="sx__fee-body">
              <span class="sx__fee-title">{{ f.title }}</span>
              <span class="sx__fee-text">{{ f.text }}</span>
            </span>
          </label>
        </div>
      </template>
      <template v-else>
        <p class="sx__text">{{ t('create.exchange.safeOffText') }}</p>
        <UiButton
          v-if="canAddPkoin"
          class="sx__add-pkoin"
          variant="pkoin"
          :size="40"
          icon="plus"
          data-testid="create-add-pkoin"
          @click="addPkoin"
        >
          {{ t('create.exchange.addPkoin') }}
        </UiButton>
      </template>
    </section>
  </template>
</template>

<style scoped>
.sx__modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sx__mode {
  padding: 14px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.sx__mode:hover {
  border-color: var(--border-strong);
}

.sx__mode:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.sx__mode--on,
.sx__mode--on:hover {
  border: 2px solid var(--primary);
  padding: 13.5px;
  background: var(--primary-soft);
}

.sx__mode-title {
  font-size: 15px;
  font-weight: 600;
}

.sx__mode-text {
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}

.sx__link {
  color: var(--link);
  font-weight: 600;
}

.sx__mylist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sx__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sx__chip {
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--muted);
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.sx__chip--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.sx__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.sx__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.sx__price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px 16px;
}

.sx__amount {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 1 300px;
  min-width: 0;
}

.sx__amount-label {
  font-size: 13px;
  font-weight: 600;
}

.sx__amount-box {
  display: flex;
  height: 48px;
  border-radius: 12px;
  background: var(--muted);
  border: 1.5px solid transparent;
}

.sx__amount-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.sx__amount--error .sx__amount-box {
  border-color: var(--danger);
}

.sx__amount-input {
  flex: 1;
  min-width: 0;
  padding: 0 14px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 18px;
  font-weight: 600;
}

.sx__currency {
  flex: none;
  width: 116px;
}

.sx__currency :deep(.ui-select__trigger) {
  height: 45px;
  border-color: transparent;
  border-left: 1px solid var(--border);
  border-radius: 0 12px 12px 0;
  background: transparent;
  font-weight: 600;
}

.sx__currency :deep(.ui-select__list) {
  min-width: 140px;
}

.sx__equiv {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 4px;
}

.sx__equiv-label {
  font-size: 13px;
  color: var(--text2);
}

.sx__equiv-value {
  font-size: 20px;
  font-weight: 700;
}

.sx__loading {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text2);
}

.sx__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sx__toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sx__toggle-title {
  font-size: 15px;
}

.sx__toggle-hint {
  font-size: 13px;
  color: var(--text2);
}

.sx__safe-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sx__text,
.sx__hint {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.sx__hint {
  font-size: 13px;
  line-height: 19px;
}

.sx__fees {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sx__fee {
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  display: flex;
  gap: 10px;
  cursor: pointer;
}

.sx__fee:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.sx__fee--on {
  border: 2px solid var(--primary);
  padding: 11.5px 13.5px;
  background: var(--primary-soft);
}

.sx__fee-dot {
  flex: none;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-strong);
  box-sizing: border-box;
}

.sx__fee--on .sx__fee-dot {
  border: 6px solid var(--primary);
}

.sx__fee-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sx__fee-title {
  font-size: 15px;
  font-weight: 600;
}

.sx__fee-text {
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}

.sx__add-pkoin {
  align-self: flex-start;
}

.sx__error {
  margin: -8px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

@media (max-width: 767px) {
  .sx__modes {
    grid-template-columns: 1fr 1fr;
  }

  .sx__mode-text {
    display: none;
  }

  .sx__amount {
    flex: 1 1 100%;
  }

  .sx__fees {
    grid-template-columns: 1fr;
  }

  .sx__fee-text {
    display: none;
  }
}
</style>
