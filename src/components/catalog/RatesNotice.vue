<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRates } from '@/api/queries'
import { useCurrencyStore } from '@/stores/currency'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Не получили курс RUB — показываем цены только в PKOIN» (s2-catalog-states):
 * prices stay, the equivalent is missing, and the rate can be asked again.
 */
const { t } = useI18n()
const rates = useRates()
const currency = useCurrencyStore()
const ui = useUiStore()
const shown = computed(
  () => !!currency.shown && rates.isError.value && !rates.data.value?.[currency.shown]
)
</script>

<template>
  <div v-if="shown" class="rates" role="status" data-testid="rates-notice">
    <UiIcon name="warning" :size="20" />
    <span class="rates__text">{{ t('list.ratesFailed', { code: currency.shown }) }}</span>
    <UiButton
      variant="neutral"
      :size="32"
      :loading="rates.isFetching.value"
      @click="rates.refetch()"
    >
      {{ t('list.retry') }}
    </UiButton>
    <!-- s8-system-desktop «Нет курса валюты»: another currency may have a rate. -->
    <UiButton
      variant="ghost"
      :size="32"
      data-testid="rates-change"
      @click="ui.openDialog('currency')"
    >
      {{ t('list.changeCurrency') }}
    </UiButton>
  </div>
</template>

<style scoped>
.rates {
  padding: 12px 16px;
  flex-wrap: nowrap;
  border-radius: 14px;
  background: var(--warning-soft);
  display: flex;
  align-items: center;
  gap: 12px;
}

.rates .ui-icon {
  flex: none;
  color: var(--warning);
}

.rates__text {
  flex: 1;
  font-size: 14px;
  line-height: 20px;
}

@media (max-width: 767px) {
  .rates {
    flex-wrap: wrap;
  }

  .rates__text {
    flex-basis: calc(100% - 32px);
  }
}
</style>
