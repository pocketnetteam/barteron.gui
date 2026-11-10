<script setup lang="ts">
import { computed } from 'vue'
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'
import UiSpinner from './UiSpinner.vue'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

/**
 * Inline feedback and system banners (under the header): a tinted block with
 * an icon, a title, text and an optional action on the right.
 */
const props = withDefaults(
  defineProps<{
    tone?: AlertTone
    title?: string
    icon?: IconName
    /** A spinner instead of the icon: something is in progress (account activation). */
    busy?: boolean
    /** Announce to screen readers when it appears. */
    live?: boolean
  }>(),
  { tone: 'info' }
)

const DEFAULT_ICONS: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'error',
  neutral: 'bell',
}

const iconName = computed(() => props.icon ?? DEFAULT_ICONS[props.tone])
</script>

<template>
  <div
    class="ui-alert"
    :class="`ui-alert--${tone}`"
    :role="live ? (tone === 'danger' ? 'alert' : 'status') : undefined"
  >
    <UiSpinner v-if="busy" class="ui-alert__icon" :size="20" :stroke="2.2" />
    <UiIcon
      v-else
      class="ui-alert__icon"
      :name="iconName"
      :size="20"
      :stroke="tone === 'success' ? 2 : 1.8"
    />
    <div class="ui-alert__body">
      <span v-if="title" class="ui-alert__title">{{ title }}</span>
      <span v-if="$slots.default" class="ui-alert__text"><slot /></span>
    </div>
    <div v-if="$slots.action" class="ui-alert__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.ui-alert {
  --tone: var(--info);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--info-soft);
}

.ui-alert--success {
  --tone: var(--success);
  background: var(--success-soft);
}
.ui-alert--warning {
  --tone: var(--warning);
  background: var(--warning-soft);
}
.ui-alert--danger {
  --tone: var(--danger);
  background: var(--danger-soft);
}
.ui-alert--neutral {
  --tone: var(--text2);
  align-items: center;
  background: var(--subtle);
  box-shadow: 0 0 0 1px var(--border);
}

.ui-alert__icon {
  margin-top: 1px;
  color: var(--tone);
}

.ui-alert--neutral .ui-alert__icon {
  margin-top: 0;
}

.ui-alert__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ui-alert__title {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.ui-alert__text {
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.ui-alert--neutral .ui-alert__text {
  font-size: 14px;
  line-height: 19px;
  color: var(--text);
}

.ui-alert__action {
  flex: none;
}

/* Phones: the action goes under the text, aligned with it. */
@media (max-width: 767px) {
  .ui-alert {
    flex-wrap: wrap;
  }

  .ui-alert__action {
    flex-basis: 100%;
    padding-left: 32px;
  }
}
</style>
