<script setup lang="ts">
import type { IconName } from '@/ui/icons'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

/**
 * The status line over an offer (s3-item-states): «Публикуется в сети…»,
 * «Не опубликовано…», «Снято 12 октября», «Срок публикации истёк». On my
 * own active offer — the line with the network mark and «Автопродление».
 */
withDefaults(
  defineProps<{
    tone?: 'surface' | 'neutral' | 'warning' | 'danger'
    icon?: IconName
    spinner?: boolean
    title?: string
    text?: string
  }>(),
  { tone: 'neutral' }
)
</script>

<template>
  <div class="notice" :class="`notice--${tone}`" role="status">
    <div class="notice__main">
      <slot name="lead">
        <UiSpinner v-if="spinner" class="notice__icon" :size="18" />
        <UiIcon v-else-if="icon" class="notice__icon" :name="icon" :size="18" />
      </slot>
      <p class="notice__text">
        <strong v-if="title">{{ title }}</strong>
        {{ text }}
        <slot />
      </p>
    </div>
    <div v-if="$slots.end" class="notice__end"><slot name="end" /></div>
  </div>
</template>

<style scoped>
.notice {
  min-height: 56px;
  padding: 10px 20px;
  border-radius: var(--radius-l);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 20px;
  font-size: 14px;
  line-height: 20px;
}

.notice__main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.notice__icon {
  flex: none;
}

.notice__text strong {
  font-weight: 700;
}

.notice__end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
}

.notice--surface {
  background: var(--surface);
  color: var(--text2);
}

.notice--neutral {
  background: var(--muted);
  color: var(--text);
}

.notice--neutral .notice__icon {
  color: var(--text2);
}

.notice--warning {
  background: var(--warning-soft);
  color: var(--text);
}

.notice--warning .notice__icon {
  color: var(--warning);
}

.notice--danger {
  background: var(--danger-soft);
  color: var(--text);
}

.notice--danger .notice__icon {
  color: var(--danger);
}

@media (max-width: 767px) {
  .notice {
    padding: 10px 14px;
    border-radius: var(--radius-m);
    font-size: 13px;
    line-height: 18px;
  }
}
</style>
