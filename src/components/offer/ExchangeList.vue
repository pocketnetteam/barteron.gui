<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import UiIcon from '@/ui/UiIcon.vue'
import type { ExchangeItem } from './types'

/**
 * «Меняю на» (principle 02: exchange is on a par with the price).
 * - `inline` — card: «Меняю на: Самокаты, Ролики +2»;
 * - `tags` — list row: label and small tags;
 * - `block` — item page: large tags, a check on the ones that match my offers.
 */
const props = withDefaults(
  defineProps<{
    items?: ExchangeItem[]
    /** «что-нибудь» */
    anything?: boolean
    variant?: 'inline' | 'tags' | 'block'
    /** How many to show inline before «+N». */
    max?: number
  }>(),
  { items: () => [], variant: 'inline', max: 2 }
)

const { t } = useI18n()

const shown = computed(() =>
  props.variant === 'inline' ? props.items.slice(0, props.max) : props.items
)
const rest = computed(() => props.items.length - shown.value.length)
</script>

<template>
  <p v-if="variant === 'inline'" class="xl xl--inline">
    {{ t('exchange.label') }}
    <template v-if="anything || !items.length">{{ t('exchange.anything') }}</template>
    <template v-for="(item, i) in shown" :key="i">
      <RouterLink v-if="item.to" :to="item.to" class="xl__link">{{ item.label }}</RouterLink>
      <span v-else>{{ item.label }}</span>
      <template v-if="i < shown.length - 1">, </template>
    </template>
    <span v-if="rest > 0" class="xl__rest">&nbsp;{{ t('exchange.more', { n: rest }) }}</span>
  </p>

  <div v-else class="xl" :class="`xl--${variant}`">
    <span v-if="variant === 'tags'" class="xl__label">{{ t('exchange.label') }}</span>
    <span v-if="anything || !items.length" class="xl__tag xl__tag--free">
      {{ t('exchange.anything') }}
    </span>
    <ul class="xl__tags">
      <li v-for="(item, i) in items" :key="i">
        <component
          :is="item.to ? RouterLink : 'span'"
          :to="item.to"
          class="xl__tag"
          :class="{ 'xl__tag--free': !item.category, 'xl__tag--match': item.match }"
        >
          <UiIcon v-if="item.match" name="check" :size="14" :stroke="2.4" />
          {{ item.label }}
          <span v-if="item.match" class="visually-hidden">— {{ t('exchange.matches') }}</span>
        </component>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.xl--inline {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.xl__link {
  position: relative;
  z-index: 1;
  color: var(--link);
}

.xl__rest {
  color: var(--text3);
}

.xl--tags,
.xl--block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.xl__label {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.xl__tags {
  display: flex;
  flex-wrap: wrap;
  gap: inherit;
}

.xl__tag {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--primary-soft);
  color: var(--link);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  text-decoration: none;
}

.xl__tag--free {
  background: var(--muted);
  color: var(--text);
}

.xl--block {
  gap: 8px;
}

.xl--block .xl__tag {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-s);
  font-size: 14px;
  line-height: 20px;
}

.xl--block .xl__tag--free {
  font-weight: 400;
}

a.xl__tag:hover {
  background: var(--primary-soft-hover);
  text-decoration: none;
}
</style>
