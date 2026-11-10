<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CURRENCIES } from '@/api/rates'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { OfferPrice } from '@/components/offer/types'
import { useCurrencyStore } from '@/stores/currency'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Price and actions on someone else's offer (s3-item-desktop, right column;
 * s3-item-states «срок публикации истёк», «способ не выбран»).
 */
const props = defineProps<{
  price: OfferPrice
  /** Expired or taken off: no exchange or purchase, only a question to the seller. */
  inactive?: boolean
  /** Shown to the owner as buyers see it: buttons do nothing. */
  preview?: boolean
  /** `seller` / `inHalf` — the seller pays the guarantor fee in a safe deal. */
  safeDealFee?: string
  /** «Выбран пункт выдачи на Таганской · 60 PKOIN» */
  chosen?: string | null
  /** «Купить» was pressed before a way to get the item was picked. */
  pickHint?: boolean
  /** A pickup point: one button, chat with its owner. */
  pickupPoint?: boolean
  similarLabel?: string | null
  busy?: boolean
}>()
defineEmits<{ exchange: []; buy: []; ask: []; similar: [] }>()
const { t } = useI18n()
const currency = useCurrencyStore()

const currencyOptions = computed(() => CURRENCIES.map((c) => c.code))
const showCurrency = computed(() => !props.price.free && !!props.price.equivalent)
</script>

<template>
  <section class="buy" :aria-label="t('item.buy.label')">
    <PriceTag :price="price" :size="28" stacked :muted="inactive">
      <label v-if="showCurrency" class="buy__currency">
        <span class="visually-hidden">{{ t('currency.title') }}</span>
        <select
          :value="currency.code"
          @change="currency.set(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="code in currencyOptions" :key="code" :value="code">{{ code }}</option>
        </select>
        <UiIcon name="chevron" :size="12" :stroke="2.2" />
      </label>
    </PriceTag>

    <template v-if="inactive">
      <p class="buy__note">{{ t('item.buy.inactiveText') }}</p>
      <UiButton
        variant="neutral"
        :size="52"
        block
        external
        :disabled="preview"
        @click="$emit('ask')"
      >
        {{ t('item.buy.ask') }}
      </UiButton>
      <button v-if="similarLabel" type="button" class="buy__link" @click="$emit('similar')">
        {{ t('item.buy.similar', { name: similarLabel }) }}
      </button>
    </template>

    <template v-else-if="pickupPoint">
      <UiButton :size="52" block external :disabled="preview" @click="$emit('ask')">
        {{ t('item.buy.askPoint') }}
      </UiButton>
    </template>

    <template v-else>
      <div class="buy__actions">
        <UiButton
          :size="52"
          block
          icon="exchange"
          :disabled="preview || busy"
          data-testid="item-exchange"
          @click="$emit('exchange')"
        >
          {{ t('item.buy.exchange') }}
        </UiButton>
        <UiButton
          variant="contrast"
          :size="52"
          block
          :disabled="preview || busy"
          data-testid="item-buy"
          @click="$emit('buy')"
        >
          {{ t('item.buy.buy') }}
        </UiButton>
        <UiButton
          variant="neutral"
          :size="52"
          block
          external
          :disabled="preview || busy"
          data-testid="item-ask"
          @click="$emit('ask')"
        >
          {{ t('item.buy.ask') }}
        </UiButton>
      </div>

      <p v-if="pickHint" class="buy__hint" role="status">
        <UiIcon name="info" :size="18" />
        <span>{{ t('item.buy.pickHint') }}</span>
      </p>

      <div v-if="safeDealFee" class="buy__safe">
        <UiIcon name="safe-deal" :size="20" />
        <p>
          <strong>{{ t('item.buy.safeTitle') }}</strong>
          {{ safeDealFee === 'seller' ? t('item.buy.safeSeller') : t('item.buy.safeHalf') }}
        </p>
      </div>

      <p v-if="chosen" class="buy__chosen">
        <UiIcon name="pickup-point" :size="18" />
        <span>{{ chosen }}</span>
      </p>
    </template>
  </section>
</template>

<style scoped>
.buy {
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.buy__currency {
  position: relative;
  margin-left: 6px;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  color: var(--text2);
}

.buy__currency select {
  appearance: none;
  height: 26px;
  padding: 0 22px 0 8px;
  border: 0;
  border-radius: var(--radius-s);
  background: var(--muted);
  color: var(--text2);
  font: 600 12px / 26px var(--font-sans);
  cursor: pointer;
}

.buy__currency select:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.buy__currency .ui-icon {
  position: absolute;
  right: 7px;
  pointer-events: none;
}

.buy__actions {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.buy__note {
  color: var(--text2);
  font-size: 15px;
  line-height: 22px;
}

.buy__link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
}

.buy__hint {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--info-soft);
  color: var(--text);
  font-size: 13px;
  line-height: 18px;
  display: flex;
  gap: 8px;
}

.buy__hint .ui-icon {
  flex: none;
  color: var(--info);
}

.buy__safe {
  margin-top: 4px;
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--success-soft);
  display: flex;
  gap: 10px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.buy__safe .ui-icon {
  flex: none;
  color: var(--success);
}

.buy__safe strong {
  color: var(--text);
  font-weight: 600;
}

.buy__chosen {
  display: flex;
  gap: 8px;
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.buy__chosen .ui-icon {
  flex: none;
  color: var(--link);
}
</style>
