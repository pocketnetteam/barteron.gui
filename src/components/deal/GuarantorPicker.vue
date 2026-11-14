<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GuarantorOption } from '@/composables/safe-deal'
import { formatPkoin } from '@/lib/format'
import { buyerShare, moneyFromValue, type FeeVariant } from '@/models/safe-deal'
import UiAlert from '@/ui/UiAlert.vue'
import UiAvatar from '@/ui/UiAvatar.vue'
import UiButton from '@/ui/UiButton.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * «Выберите гаранта» (s3-item-dialogs): guarantors with their fee and
 * status, and what the fee costs the buyer at the offer's price.
 */
const props = defineProps<{
  options: GuarantorOption[]
  loading?: boolean
  failed?: boolean
  /** The offer's price in PKOIN; `null` — unknown (no rate for its currency). */
  price: number | null
  variant: FeeVariant
}>()
const selected = defineModel<string | null>({ default: null })
const emit = defineEmits<{ retry: [] }>()
const { t, locale } = useI18n()

const chosen = computed(() => props.options.find((o) => o.address === selected.value) ?? null)
const money = computed(() =>
  chosen.value?.fee && props.price
    ? moneyFromValue(props.price, chosen.value.fee, props.variant)
    : null
)
const pk = (value: number) => `${formatPkoin(value, locale.value)} PKOIN`
const rating = (value: number) =>
  new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
const fee = (value: number) =>
  new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value)
</script>

<template>
  <div class="gp" data-testid="guarantor-picker">
    <p class="gp__sub">{{ t('deal.buy.guarantorSubtitle') }}</p>

    <div v-if="loading" class="gp__list">
      <UiSkeleton v-for="i in 3" :key="i" width="100%" :ratio="'8 / 1'" radius="12px" />
    </div>
    <UiAlert v-else-if="failed" tone="danger" live>
      {{ t('deal.buy.failed') }}
      <template #action>
        <UiButton variant="outline" :size="36" @click="emit('retry')">{{ t('ui.retry') }}</UiButton>
      </template>
    </UiAlert>
    <UiAlert v-else-if="!options.some((o) => o.available)" tone="warning" live>
      {{ t('deal.buy.empty') }}
    </UiAlert>

    <div
      v-if="!loading && options.length"
      class="gp__list"
      role="radiogroup"
      :aria-label="t('deal.buy.guarantorTitle')"
    >
      <label
        v-for="o in options"
        :key="o.address"
        class="gp__row"
        :class="{ 'gp__row--on': selected === o.address, 'gp__row--off': !o.available }"
        data-testid="guarantor-option"
        :data-address="o.address"
      >
        <input
          v-model="selected"
          class="visually-hidden"
          type="radio"
          name="guarantor"
          :value="o.address"
          :disabled="!o.available"
        />
        <span class="gp__radio" aria-hidden="true" />
        <UiAvatar :size="40" :name="o.name" :src="o.avatar" :seed="o.address" />
        <span class="gp__who">
          <span class="gp__name">{{ o.name }}</span>
          <span class="gp__meta">{{
            o.ratingCount
              ? t('deal.buy.scores', { rating: rating(o.rating), n: o.ratingCount }, o.ratingCount)
              : t('deal.buy.noScores')
          }}</span>
        </span>
        <span class="gp__fee">
          <strong v-if="o.fee">{{ fee(o.fee) }}%</strong>
          <span :class="o.available ? 'gp__on' : 'gp__off'">{{
            o.available ? t('deal.buy.available') : t('deal.buy.unavailable')
          }}</span>
        </span>
      </label>
    </div>

    <dl v-if="chosen?.fee" class="gp__sum" data-testid="guarantor-sum">
      <div>
        <dt>{{ t('deal.buy.fee', { fee: fee(chosen.fee) }) }}</dt>
        <dd v-if="money">{{ pk(money.fee) }}</dd>
      </div>
      <div>
        <dt>{{ t('deal.buy.youPay') }}</dt>
        <dd v-if="variant === 'seller'">{{ t('deal.buy.sellerPays') }}</dd>
        <dd v-else-if="money">
          {{
            buyerShare(variant) < 1
              ? t('deal.buy.youPayHalf', {
                  amount: formatPkoin(money.payment - money.value, locale),
                })
              : t('deal.buy.youPayAll', { amount: formatPkoin(money.fee, locale) })
          }}
        </dd>
      </div>
    </dl>
    <p class="gp__note">{{ t('deal.buy.note') }}</p>
  </div>
</template>

<style scoped>
.gp {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gp__sub,
.gp__note {
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
}

.gp__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gp__row {
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  background: var(--page);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.gp__row--on {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.gp__row--off {
  cursor: default;
  opacity: 0.55;
}

.gp__row:has(input:focus-visible) {
  box-shadow: 0 0 0 3px var(--ring);
}

/* Chrome 89 and Safari 15.0–15.3 have no :has(): the ring on any focus there. */
@supports not selector(:has(*)) {
  .gp__row:focus-within {
    box-shadow: 0 0 0 3px var(--ring);
  }
}

.gp__radio {
  width: 18px;
  height: 18px;
  flex: none;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
  box-sizing: border-box;
}

.gp__row--on .gp__radio {
  border: 5px solid var(--primary);
}

.gp__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.gp__name {
  font-weight: 600;
  font-size: 15px;
  line-height: 20px;
}

.gp__meta {
  color: var(--text2);
  font-size: 12px;
  line-height: 16px;
}

.gp__fee {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 15px;
  line-height: 20px;
}

.gp__on,
.gp__off {
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}

.gp__on {
  color: var(--success);
}

.gp__off {
  color: var(--text3);
}

.gp__sum {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-m);
  background: var(--page);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 18px;
}

.gp__sum div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.gp__sum dt {
  color: var(--text2);
}

.gp__sum dd {
  margin: 0;
  text-align: right;
}
</style>
