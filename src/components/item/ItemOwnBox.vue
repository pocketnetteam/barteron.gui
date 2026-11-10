<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PriceTag from '@/components/offer/PriceTag.vue'
import type { OfferPrice } from '@/components/offer/types'
import type { OfferOperation } from '@/composables/offer-actions'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

/**
 * Right column of my own offer (s3-itemown-desktop) and its states while a
 * transaction is on its way (s3-item-states, «Своё · …»).
 */
const props = defineProps<{
  price: OfferPrice
  /** Price in the chain while a new one is being published. */
  oldPrice?: OfferPrice | null
  lifecycle: 'active' | 'withdrawn' | 'expired'
  operation: OfferOperation | null
  matches?: number
  canRenew: boolean
}>()
defineEmits<{
  find: []
  edit: []
  share: []
  promote: []
  withdraw: []
  renew: []
  remove: []
  retry: []
}>()
const { t } = useI18n()

const op = computed(() => props.operation)
const locked = computed(() => op.value?.kind === 'publishing' || op.value?.kind === 'updating')
const removing = computed(() => op.value?.kind === 'withdrawing' || op.value?.kind === 'removing')
const steps = computed(() => {
  const tx = op.value?.tx
  const sent = !!tx?.txid
  return [
    { label: t('net.stepSent'), state: sent ? ('done' as const) : ('active' as const) },
    { label: t('net.stepBlock'), state: sent ? ('active' as const) : ('pending' as const) },
  ]
})
</script>

<template>
  <section class="own" :aria-label="t('item.own.label')">
    <!-- The node refused -->
    <template v-if="op?.kind === 'failed'">
      <p class="own__text">{{ t('item.own.failedText') }}</p>
      <UiButton
        variant="contrast"
        :size="48"
        block
        icon="retry"
        data-testid="own-retry"
        @click="$emit('retry')"
      >
        {{
          op.action === 'remove'
            ? t('item.own.retryRemove')
            : op.action === 'withdraw'
              ? t('item.own.retryWithdraw')
              : t('item.own.retryPublish')
        }}
      </UiButton>
      <UiButton
        v-if="op.action === 'publish'"
        variant="neutral"
        :size="44"
        block
        @click="$emit('edit')"
      >
        {{ t('item.own.backToEdit') }}
      </UiButton>
    </template>

    <!-- Withdrawing / deleting: everything waits -->
    <template v-else-if="removing">
      <PriceTag :price="price" :size="28" muted />
      <p class="own__text own__text--muted">{{ t('item.own.lockedText') }}</p>
    </template>

    <template v-else>
      <PriceTag :price="price" :size="28" stacked />
      <p v-if="oldPrice && op?.kind === 'updating'" class="own__old">
        <PriceTag :price="oldPrice" :size="14" no-equivalent muted />
        <span>— {{ t('item.own.inChain') }}</span>
      </p>
      <ul v-if="op?.kind === 'updating'" class="own__steps">
        <li v-for="step in steps" :key="step.label" :class="`own__step--${step.state}`">
          <UiIcon v-if="step.state === 'done'" name="check" :size="16" :stroke="2.2" />
          <UiSpinner v-else-if="step.state === 'active'" :size="16" />
          <span v-else class="own__step-dot" />
          {{ step.label }}
        </li>
      </ul>

      <!-- Taken off or expired -->
      <template v-if="lifecycle !== 'active' && !locked">
        <UiButton
          :size="48"
          block
          :disabled="!canRenew"
          data-testid="own-renew"
          @click="$emit('renew')"
        >
          {{ t('item.own.renew') }}
        </UiButton>
        <p v-if="!canRenew" class="own__text own__text--small">{{ t('item.own.renewCategory') }}</p>
        <div class="own__pair">
          <UiButton variant="neutral" :size="44" block @click="$emit('edit')">
            {{ t('item.own.edit') }}
          </UiButton>
          <UiButton
            variant="danger"
            :size="44"
            block
            data-testid="own-remove"
            @click="$emit('remove')"
          >
            {{ t('item.own.removeShort') }}
          </UiButton>
        </div>
      </template>

      <template v-else>
        <UiButton
          :size="48"
          block
          icon="exchange"
          :disabled="locked"
          data-testid="own-find"
          @click="$emit('find')"
        >
          {{ matches ? t('item.own.findCount', { n: matches }) : t('item.own.find') }}
        </UiButton>
        <div class="own__pair">
          <UiButton
            variant="neutral"
            :size="44"
            block
            icon="edit"
            :disabled="locked"
            @click="$emit('edit')"
          >
            {{ t('item.own.edit') }}
          </UiButton>
          <UiButton
            :variant="locked ? 'secondary' : 'neutral'"
            :size="44"
            block
            icon="share"
            @click="$emit('share')"
          >
            {{ t('item.shareShort') }}
          </UiButton>
        </div>
        <p v-if="locked" class="own__text own__text--small">{{ t('item.own.lockedHint') }}</p>

        <template v-if="!locked">
          <div class="own__promo">
            <strong>{{ t('item.own.promoTitle') }}</strong>
            <p>{{ t('item.own.promoText') }}</p>
            <button type="button" class="own__promo-link" @click="$emit('promote')">
              {{ t('item.own.promoLink') }}
            </button>
          </div>
          <div class="own__rows">
            <button
              type="button"
              class="own__row"
              data-testid="own-withdraw"
              @click="$emit('withdraw')"
            >
              <UiIcon name="withdraw" :size="18" />
              {{ t('item.own.withdraw') }}
            </button>
            <button
              type="button"
              class="own__row own__row--danger"
              data-testid="own-remove"
              @click="$emit('remove')"
            >
              <UiIcon name="delete" :size="18" />
              {{ t('item.own.remove') }}
            </button>
          </div>
        </template>
      </template>
    </template>
  </section>
</template>

<style scoped>
.own {
  padding: 24px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.own__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* Two labels with icons in a 292 px column. */
.own__pair :deep(.ui-button) {
  min-width: 0;
  padding-inline: 10px;
  gap: 6px;
}

.own__text {
  color: var(--text2);
  font-size: 14px;
  line-height: 20px;
}

.own__text--small {
  font-size: 12px;
  line-height: 16px;
}

.own__text--muted {
  color: var(--text3);
}

.own__old {
  margin-top: -6px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text3);
  font-size: 13px;
}

.own__old :deep(.price) {
  text-decoration: line-through;
}

.own__steps {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
}

.own__steps li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.own__step--done .ui-icon {
  color: var(--success);
}

.own__step--pending {
  color: var(--text3);
}

.own__step-dot {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-full);
}

.own__promo {
  margin-top: 4px;
  padding: 14px;
  border-radius: var(--radius-m);
  background: var(--warning-soft);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.own__promo strong {
  color: var(--text);
  font-size: 15px;
  line-height: 20px;
}

.own__promo-link {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--warning);
  font: 700 14px / 20px var(--font-sans);
}

.own__rows {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.own__row {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: 500 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}

.own__row .ui-icon {
  color: var(--text2);
}

.own__row--danger,
.own__row--danger .ui-icon {
  color: var(--danger);
}

.own__row:focus-visible,
.own__promo-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
  border-radius: var(--radius-s);
}
</style>
