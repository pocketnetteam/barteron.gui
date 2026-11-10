<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMoney, formatPkoin } from '@/lib/format'
import type { OfferPrice } from './types'

/**
 * Price in PKOIN with the equivalent in the chosen currency (principle 04).
 * Sizes follow the type scale: 28 — item page, 20 — list row, 18 — card,
 * 16 — own offer, 14 — compact card.
 */
const props = withDefaults(
  defineProps<{
    price: OfferPrice
    size?: 14 | 16 | 18 | 20 | 28
    /** Hide the equivalent even when it is known (compact cards). */
    noEquivalent?: boolean
    /** Inactive offer: grey. */
    muted?: boolean
    /** Equivalent on its own line (item page). */
    stacked?: boolean
  }>(),
  { size: 18 }
)

const { t, locale } = useI18n()

const main = computed(() => {
  if (props.price.free) return t('price.free')
  const value = props.price.pkoin ?? 0
  const amount = `${formatPkoin(value, locale.value)} PKOIN`
  return props.price.from ? t('price.from', { amount }) : amount
})

const equivalent = computed(() => {
  const eq = props.price.equivalent
  if (props.noEquivalent || props.price.free || !eq) return null
  return `≈ ${formatMoney(eq.amount, eq.currency, locale.value)}`
})
</script>

<template>
  <div
    class="price"
    :class="[
      `price--s${size}`,
      { 'price--free': price.free, 'price--muted': muted, 'price--stacked': stacked },
    ]"
  >
    <span class="price__main">{{ main }}</span>
    <span v-if="equivalent || $slots.default" class="price__eq">
      {{ equivalent ? ` ${equivalent}` : '' }}
      <slot />
    </span>
  </div>
</template>

<style scoped>
.price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0 6px;
  min-width: 0;
}

.price--stacked {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.price__main {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--text);
}

.price__eq {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}

.price--free .price__main {
  color: var(--success);
}

.price--muted .price__main {
  color: var(--text2);
}

.price--s28 .price__main {
  font-size: 28px;
  line-height: 36px;
  font-weight: 800;
}
.price--s28 .price__eq {
  font-size: 15px;
  line-height: 20px;
  color: var(--text2);
}

.price--s20 {
  gap: 0 8px;
}
.price--s20 .price__main {
  font-size: 20px;
  line-height: 28px;
}
.price--s20 .price__eq {
  font-size: 14px;
}

.price--s18 .price__main {
  font-size: 18px;
  line-height: 24px;
}
.price--s18 .price__eq {
  font-size: 13px;
}

.price--s16 .price__main {
  font-size: 16px;
  line-height: 22px;
}
.price--s16 .price__eq {
  font-size: 13px;
}

.price--s14 .price__main {
  font-size: 14px;
  line-height: 20px;
}
.price--s14 .price__eq {
  font-size: 12px;
}
</style>
