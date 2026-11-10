<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import UiIcon from './UiIcon.vue'

/**
 * - `stars` — value, five stars and the review count (profile, item page);
 * - `compact` — value, one star and the count (seller card);
 * - `photo` — a dark pill on top of a card photo.
 */
const props = withDefaults(
  defineProps<{
    value: number
    count?: number
    /** Link to the reviews. */
    to?: RouteLocationRaw
    variant?: 'stars' | 'compact' | 'photo'
    /** Stars only: the number stays for screen readers (a review's score). */
    hideValue?: boolean
  }>(),
  { variant: 'stars' }
)

const { t, n } = useI18n()

const valueText = computed(() =>
  n(props.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
)

/** Fill of each of the five stars, 0…1. */
const fills = computed(() => [0, 1, 2, 3, 4].map((i) => Math.min(1, Math.max(0, props.value - i))))

const label = computed(() => t('ui.rating', { value: valueText.value }))
</script>

<template>
  <span v-if="variant === 'photo'" class="ui-rating-pill" role="img" :aria-label="label">
    <UiIcon name="star-filled" :size="11" />
    {{ valueText }}
  </span>

  <span v-else class="ui-rating" :class="`ui-rating--${variant}`">
    <span
      class="ui-rating__value"
      :class="{ 'visually-hidden': hideValue }"
      role="img"
      :aria-label="label"
    >
      <span aria-hidden="true">{{ valueText }}</span>
    </span>
    <span v-if="variant === 'stars'" class="ui-rating__stars" aria-hidden="true">
      <span v-for="(fill, i) in fills" :key="i" class="ui-rating__star">
        <UiIcon class="ui-rating__star-base" name="star-filled" :size="18" />
        <span class="ui-rating__star-fill" :style="{ width: `${fill * 100}%` }">
          <UiIcon name="star-filled" :size="18" />
        </span>
      </span>
    </span>
    <UiIcon v-else class="ui-rating__one" name="star-filled" :size="14" />
    <template v-if="count !== undefined">
      <RouterLink v-if="to" :to="to" class="ui-rating__count">
        {{ t('ui.reviews', count) }}
      </RouterLink>
      <span v-else class="ui-rating__count">{{ t('ui.reviews', count) }}</span>
    </template>
  </span>
</template>

<style scoped>
.ui-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.ui-rating__value {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.ui-rating--compact .ui-rating__value {
  font-size: 14px;
  line-height: 20px;
}

.ui-rating__stars {
  display: inline-flex;
  gap: 2px;
}

.ui-rating__star {
  position: relative;
  color: var(--star);
}

.ui-rating__star-base {
  opacity: 0.35;
}

.ui-rating__star-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
}

.ui-rating__one {
  color: var(--star);
}

.ui-rating__count {
  font-size: 14px;
  line-height: 20px;
  color: var(--link);
}

span.ui-rating__count {
  color: var(--text2);
}

.ui-rating-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: var(--radius-full);
  background: var(--on-photo);
  color: #ffffff;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
}
</style>
