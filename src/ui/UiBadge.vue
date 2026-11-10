<script setup lang="ts">
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'pkoin'
  | 'info'
  | 'warning'
  | 'danger'
  /** On top of a photo: dark translucent */
  | 'photo'
  /** On top of a photo: surface-coloured */
  | 'surface'
  /** Solid violet: «Подходит для обмена» */
  | 'match'

withDefaults(
  defineProps<{
    tone?: BadgeTone
    icon?: IconName
    /** A dot before the text: status («Активно до…», «Ждём подтверждения»). */
    dot?: boolean
    /** Rounded pill instead of a 6 px tag. */
    pill?: boolean
  }>(),
  { tone: 'neutral' }
)
</script>

<template>
  <span class="ui-badge" :class="[`ui-badge--${tone}`, { 'ui-badge--pill': pill || dot }]">
    <span v-if="dot" class="ui-badge__dot" aria-hidden="true" />
    <UiIcon v-else-if="icon" :name="icon" :size="12" :stroke="2.4" />
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  background: var(--muted);
  color: var(--text);
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.ui-badge--pill {
  padding: 3px 8px;
  border-radius: var(--radius-full);
  gap: 6px;
}

.ui-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.ui-badge--primary {
  background: var(--primary-soft);
  color: var(--link);
}
.ui-badge--success {
  background: var(--success-soft);
  color: var(--success);
}
.ui-badge--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}
.ui-badge--info {
  background: var(--info-soft);
  color: var(--info);
}
.ui-badge--warning {
  background: var(--warning-soft);
  color: var(--warning);
}
.ui-badge--danger {
  background: var(--danger-soft);
  color: var(--danger);
}
.ui-badge--photo {
  background: var(--on-photo);
  color: #ffffff;
}
.ui-badge--surface {
  background: var(--surface);
  color: var(--text);
}
.ui-badge--match {
  background: var(--primary);
  color: #ffffff;
}
</style>
